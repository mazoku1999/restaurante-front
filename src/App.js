import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [clientes, setClientes] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [pedidoItems, setPedidoItems] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesResponse, menuResponse] = await Promise.all([
          axios.get('http://localhost:3000/clientes'),
          axios.get('http://localhost:3000/menu'),
        ]);
        setClientes(clientesResponse.data);
        setMenu(menuResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Error al cargar los datos. Por favor, intente de nuevo.', 'error');
      }
    };

    fetchData();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const agregarItem = (item) => {
    setPedidoItems((prev) => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
    showToast(`${item.nombre} agregado al pedido.`);
  };

  const actualizarCantidad = (id, cantidad) => {
    const cantidadNumerica = parseInt(cantidad);
    if (isNaN(cantidadNumerica) || cantidadNumerica < 0) return;

    setPedidoItems((prev) =>
      prev.map(item =>
        item.id === id
          ? cantidadNumerica === 0
            ? null
            : { ...item, cantidad: cantidadNumerica }
          : item
      ).filter(Boolean)
    );
  };

  const realizarPedido = async () => {
    if (!selectedCliente) {
      showToast('Por favor, seleccione un cliente antes de realizar el pedido.', 'error');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/pedidos', {
        clienteId: selectedCliente,
        items: pedidoItems.map(item => ({
          id: item.id,
          cantidad: item.cantidad,
          precio: item.precio,
        })),
      });
      showToast(`Pedido realizado con éxito! ID: ${response.data.id}`);
      setPedidoItems([]);
    } catch (error) {
      console.error('Error realizando el pedido:', error);
      showToast('No se pudo realizar el pedido. Por favor, intente de nuevo.', 'error');
    }
  };

  const calcularTotal = () => {
    return pedidoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  };

  return (
    <div className="app">
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
      <header className="header">
        <h1>Restaurante Gourmet</h1>
        <select
          value={selectedCliente}
          onChange={(e) => setSelectedCliente(e.target.value)}
          className="select-cliente"
        >
          <option value="">Selecciona un cliente</option>
          {clientes.map(cliente => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
      </header>

      <div className="content">
        <section className="menu-section">
          <h2>Menú del Día</h2>
          <div className="menu-grid">
            {menu.map(item => (
              <div key={item.id} className="menu-item" onClick={() => agregarItem(item)}>
                <h3>{item.nombre}</h3>
                <p className="precio">${item.precio}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pedido-section">
          <h2>Tu Pedido</h2>
          {pedidoItems.length === 0 ? (
            <p className="no-items">No hay productos en el pedido.</p>
          ) : (
            <div>
              <table className="tabla-pedido">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.nombre}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.cantidad}
                          onChange={(e) => actualizarCantidad(item.id, e.target.value)}
                          className="input-cantidad"
                        />
                      </td>
                      <td>${(item.precio * item.cantidad).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="total-section">
                <h3>Total: ${calcularTotal().toFixed(2)}</h3>
                <button
                  onClick={realizarPedido}
                  disabled={!selectedCliente || pedidoItems.length === 0}
                  className="btn-realizar-pedido"
                >
                  Realizar Pedido
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default App;