const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server);

// Armazena os dados das ambulâncias
const ambulancias = {
  "AMB-001": {
    id: "AMB-001",
    status: "disponível",
    posicao: { lat: 2.8235, lon: -60.6758 }, // Boa Vista, Roraima
    ultimaAtualizacao: new Date().toISOString(),
    ultimoMovimento: new Date().toISOString(),
    emMovimento: false,
    rota: [[2.8235, -60.6758]], // Histórico da rota
    ultimaPosicao: { lat: 2.8235, lon: -60.6758 }
  }
};

// Página principal com mapa e abas
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rastreamento de Ambulâncias - Boa Vista</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <script src="/socket.io/socket.io.js"></script>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        header {
          background-color: #2563eb;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h1 { 
          margin: 0; 
          font-size: 1.8rem;
        }
        .status-badge {
          background-color: #10b981;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
        }
        .status-badge.offline {
          background-color: #6b7280;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .tabs {
          display: flex;
          margin-bottom: 20px;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .tab {
          flex: 1;
          padding: 15px;
          text-align: center;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          border-bottom: 3px solid transparent;
        }
        .tab.active {
          background-color: #f9fafb;
          border-bottom: 3px solid #2563eb;
          color: #2563eb;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
        .map-container {
          display: flex;
          gap: 20px;
        }
        .map { 
          flex: 1;
          height: 600px; 
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .info-panel {
          width: 300px;
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-height: 600px;
          overflow-y: auto;
        }
        .ambulance-card {
          margin-bottom: 15px;
          padding: 15px;
          border-radius: 8px;
          background-color: #f9fafb;
          border-left: 4px solid #2563eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ambulance-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .ambulance-card.selected {
          background-color: #eff6ff;
          border-left-color: #2563eb;
        }
        .ambulance-card.paused {
          border-left-color: #f59e0b;
        }
        .ambulance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .ambulance-id {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .ambulance-status {
          font-size: 0.8rem;
          padding: 3px 8px;
          border-radius: 12px;
          background-color: #10b981;
          color: white;
        }
        .ambulance-status.em-rota { background-color: #3b82f6; }
        .ambulance-status.no-hospital { background-color: #f59e0b; }
        .ambulance-details {
          font-size: 0.9rem;
          color: #4b5563;
        }
        .ambulance-details p {
          margin: 5px 0;
        }
        .movement-status {
          display: flex;
          align-items: center;
          margin-top: 8px;
          font-size: 0.85rem;
        }
        .movement-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .moving {
          background-color: #10b981;
        }
        .stopped {
          background-color: #f59e0b;
        }
        .no-ambulances {
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }
        .stats-container {
          margin-top: 20px;
          padding: 15px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .stats-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .stat-card {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2563eb;
          margin: 5px 0;
        }
        .stat-label {
          font-size: 0.9rem;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Rastreamento de Ambulâncias - Boa Vista</h1>
          <div id="connection-status" class="status-badge">
            <div class="status-dot"></div>
            <span>Conectado</span>
          </div>
        </header>
        
        <div class="tabs">
          <div class="tab active" data-tab="active">Ambulâncias Ativas</div>
          <div class="tab" data-tab="paused">Ambulâncias em Pausa</div>
        </div>
        
        <div id="active-tab" class="tab-content active">
          <div class="map-container">
            <div id="active-map" class="map"></div>
            
            <div class="info-panel">
              <div id="active-ambulances-list">
                <div class="no-ambulances">Nenhuma ambulância ativa no momento</div>
              </div>
            </div>
          </div>
        </div>
        
        <div id="paused-tab" class="tab-content">
          <div class="map-container">
            <div id="paused-map" class="map"></div>
            
            <div class="info-panel">
              <div id="paused-ambulances-list">
                <div class="no-ambulances">Nenhuma ambulância em pausa no momento</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="stats-container">
          <div class="stats-header">
            <h2 class="stats-title">Estatísticas Gerais</h2>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value" id="total-ambulances">0</div>
              <div class="stat-label">Total de Ambulâncias</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value" id="active-count">0</div>
              <div class="stat-label">Ambulâncias Ativas</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value" id="paused-count">0</div>
              <div class="stat-label">Ambulâncias em Pausa</div>
            </div>
          </div>
        </div>
      </div>

      <script>
        // Inicializa o Socket.IO para atualizações em tempo real
        const socket = io();
        let activeMap, pausedMap;
        let markers = {};
        let routes = {};
        let selectedAmbulanceId = null;
        let ambulancesData = {};
        
        // Função para inicializar os mapas
        function initMaps() {
          // Coordenadas de Boa Vista, Roraima
          const boaVistaCoords = [2.8235, -60.6758];
          
          // Inicializa o mapa de ambulâncias ativas
          activeMap = L.map('active-map').setView(boaVistaCoords, 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(activeMap);
          
          // Inicializa o mapa de ambulâncias em pausa
          pausedMap = L.map('paused-map').setView(boaVistaCoords, 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(pausedMap);
          
          // Carrega os dados iniciais das ambulâncias
          fetch('/ambulancias')
            .then(response => response.json())
            .then(data => {
              ambulancesData = data;
              updateAmbulancesDisplay();
            })
            .catch(error => {
              console.error('Erro ao carregar dados iniciais:', error);
            });
        }
        
        // Função para criar um ícone de marcador personalizado
        function createMarkerIcon(status, isMoving) {
          let color = '#2563eb'; // Azul padrão
          
          if (!isMoving) {
            color = '#f59e0b'; // Laranja para parado
          } else if (status === 'em-rota') {
            color = '#3b82f6'; // Azul mais claro para em rota
          } else if (status === 'no-hospital') {
            color = '#f59e0b'; // Laranja para no hospital
          }
          
          return L.divIcon({
            html: \`<div style="background-color: \${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>\`,
            className: 'ambulance-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
        }
        
        // Função para atualizar a exibição das ambulâncias
        function updateAmbulancesDisplay() {
          // Limpa as listas
          document.getElementById('active-ambulances-list').innerHTML = '';
          document.getElementById('paused-ambulances-list').innerHTML = '';
          
          let activeCount = 0;
          let pausedCount = 0;
          
          // Processa cada ambulância
          Object.values(ambulancesData).forEach(ambulancia => {
            // Verifica se a ambulância está em movimento ou parada por mais de 3 minutos
            const isMoving = ambulancia.emMovimento;
            const lastMovementTime = new Date(ambulancia.ultimoMovimento);
            const timeSinceLastMovement = (new Date() - lastMovementTime) / 1000 / 60; // em minutos
            const isPaused = !isMoving && timeSinceLastMovement >= 3;
            
            // Atualiza contadores
            if (isPaused) {
              pausedCount++;
            } else {
              activeCount++;
            }
            
            // Cria ou atualiza o marcador
            updateAmbulanceMarker(ambulancia, isMoving, isPaused);
            
            // Adiciona à lista apropriada
            addToAmbulanceList(ambulancia, isMoving, isPaused);
          });
          
          // Atualiza estatísticas
          document.getElementById('total-ambulances').textContent = Object.keys(ambulancesData).length;
          document.getElementById('active-count').textContent = activeCount;
          document.getElementById('paused-count').textContent = pausedCount;
          
          // Exibe mensagem se não houver ambulâncias
          if (activeCount === 0) {
            document.getElementById('active-ambulances-list').innerHTML = 
              '<div class="no-ambulances">Nenhuma ambulância ativa no momento</div>';
          }
          
          if (pausedCount === 0) {
            document.getElementById('paused-ambulances-list').innerHTML = 
              '<div class="no-ambulances">Nenhuma ambulância em pausa no momento</div>';
          }
        }
        
        // Função para atualizar o marcador de uma ambulância
        function updateAmbulanceMarker(ambulancia, isMoving, isPaused) {
          const position = [ambulancia.posicao.lat, ambulancia.posicao.lon];
          const map = isPaused ? pausedMap : activeMap;
          
          // Remove marcadores existentes em ambos os mapas
          if (markers[ambulancia.id]) {
            if (markers[ambulancia.id].activeMarker) {
              activeMap.removeLayer(markers[ambulancia.id].activeMarker);
            }
            if (markers[ambulancia.id].pausedMarker) {
              pausedMap.removeLayer(markers[ambulancia.id].pausedMarker);
            }
          }
          
          // Cria um novo marcador no mapa apropriado
          const icon = createMarkerIcon(ambulancia.status, isMoving);
          const marker = L.marker(position, { icon }).addTo(map)
            .bindPopup(\`
              <b>Ambulância \${ambulancia.id}</b><br>
              Status: \${ambulancia.status}<br>
              \${isMoving ? 'Em movimento' : 'Parada'}<br>
              \${!isMoving ? 'Parada há: ' + formatTimeSince(ambulancia.ultimoMovimento) : ''}
            \`);
          
          // Armazena o marcador
          if (!markers[ambulancia.id]) {
            markers[ambulancia.id] = {};
          }
          
          if (isPaused) {
            markers[ambulancia.id].pausedMarker = marker;
          } else {
            markers[ambulancia.id].activeMarker = marker;
          }
          
          // Atualiza a rota se estiver em movimento
          if (isMoving && ambulancia.rota && ambulancia.rota.length > 1) {
            if (routes[ambulancia.id]) {
              activeMap.removeLayer(routes[ambulancia.id]);
            }
            routes[ambulancia.id] = L.polyline(ambulancia.rota, { color: '#2563eb', weight: 3 }).addTo(activeMap);
          }
          
          // Se esta ambulância estiver selecionada, centraliza o mapa nela
          if (selectedAmbulanceId === ambulancia.id) {
            map.setView(position, 15);
          }
        }
        
        // Função para adicionar uma ambulância à lista apropriada
        function addToAmbulanceList(ambulancia, isMoving, isPaused) {
          const listId = isPaused ? 'paused-ambulances-list' : 'active-ambulances-list';
          const list = document.getElementById(listId);
          
          const timeSinceUpdate = formatTimeSince(ambulancia.ultimaAtualizacao);
          const timeSinceMovement = formatTimeSince(ambulancia.ultimoMovimento);
          
          const card = document.createElement('div');
          card.className = \`ambulance-card \${isPaused ? 'paused' : ''} \${selectedAmbulanceId === ambulancia.id ? 'selected' : ''}\`;
          card.dataset.id = ambulancia.id;
          
          card.innerHTML = \`
            <div class="ambulance-header">
              <div class="ambulance-id">\${ambulancia.id}</div>
              <div class="ambulance-status \${ambulancia.status === 'em-rota' ? 'em-rota' : ambulancia.status === 'no-hospital' ? 'no-hospital' : ''}">\${ambulancia.status}</div>
            </div>
            <div class="ambulance-details">
              <p>Lat: \${ambulancia.posicao.lat.toFixed(6)}</p>
              <p>Lon: \${ambulancia.posicao.lon.toFixed(6)}</p>
              <p>Última atualização: \${timeSinceUpdate}</p>
              <div class="movement-status">
                <div class="movement-indicator \${isMoving ? 'moving' : 'stopped'}"></div>
                \${isMoving ? 'Em movimento' : 'Parada há: ' + timeSinceMovement}
              </div>
            </div>
          \`;
          
          // Adiciona evento de clique para selecionar a ambulância
          card.addEventListener('click', () => {
            // Remove a classe 'selected' de todos os cards
            document.querySelectorAll('.ambulance-card').forEach(c => {
              c.classList.remove('selected');
            });
            
            // Adiciona a classe 'selected' ao card clicado
            card.classList.add('selected');
            
            // Atualiza a ambulância selecionada
            selectedAmbulanceId = ambulancia.id;
            
            // Centraliza o mapa na ambulância selecionada
            const map = isPaused ? pausedMap : activeMap;
            map.setView([ambulancia.posicao.lat, ambulancia.posicao.lon], 15);
            
            // Abre o popup do marcador
            const marker = isPaused ? 
              markers[ambulancia.id].pausedMarker : 
              markers[ambulancia.id].activeMarker;
              
            if (marker) {
              marker.openPopup();
            }
          });
          
          list.appendChild(card);
        }
        
        // Função para formatar o tempo decorrido
        function formatTimeSince(dateString) {
          const date = new Date(dateString);
          const seconds = Math.floor((new Date() - date) / 1000);
          
          if (seconds < 60) {
            return \`\${seconds} segundos\`;
          }
          
          const minutes = Math.floor(seconds / 60);
          if (minutes < 60) {
            return \`\${minutes} minutos\`;
          }
          
          const hours = Math.floor(minutes / 60);
          if (hours < 24) {
            return \`\${hours} horas\`;
          }
          
          const days = Math.floor(hours / 24);
          return \`\${days} dias\`;
        }
        
        // Função para calcular a distância entre dois pontos (fórmula de Haversine)
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const R = 6371; // Raio da Terra em km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c; // Distância em km
          return distance;
        }
        
        // Configuração das abas
        document.querySelectorAll('.tab').forEach(tab => {
          tab.addEventListener('click', () => {
            // Remove a classe 'active' de todas as abas
            document.querySelectorAll('.tab').forEach(t => {
              t.classList.remove('active');
            });
            
            // Adiciona a classe 'active' à aba clicada
            tab.classList.add('active');
            
            // Esconde todos os conteúdos de aba
            document.querySelectorAll('.tab-content').forEach(content => {
              content.classList.remove('active');
            });
            
            // Mostra o conteúdo da aba selecionada
            const tabId = tab.dataset.tab;
            document.getElementById(\`\${tabId}-tab\`).classList.add('active');
            
            // Atualiza os mapas para garantir que eles sejam renderizados corretamente
            setTimeout(() => {
              activeMap.invalidateSize();
              pausedMap.invalidateSize();
            }, 10);
          });
        });
        
        // Monitora o status da conexão Socket.IO
        socket.on('connect', () => {
          document.getElementById('connection-status').classList.remove('offline');
          document.getElementById('connection-status').querySelector('span').textContent = 'Conectado';
        });
        
        socket.on('disconnect', () => {
          document.getElementById('connection-status').classList.add('offline');
          document.getElementById('connection-status').querySelector('span').textContent = 'Desconectado';
        });
        
        // Recebe atualizações em tempo real
        socket.on('atualizacao-ambulancia', (ambulancia) => {
          ambulancesData[ambulancia.id] = ambulancia;
          updateAmbulancesDisplay();
        });
        
        // Inicializa os mapas quando a página carregar
        window.onload = initMaps;
      </script>
    </body>
    </html>
  `);
});

// API para obter todas as ambulâncias
app.get("/ambulancias", (req, res) => {
  res.json(ambulancias);
});

// API para obter uma ambulância específica
app.get("/ambulancias/:id", (req, res) => {
  const id = req.params.id;
  if (ambulancias[id]) {
    res.json(ambulancias[id]);
  } else {
    res.status(404).json({ erro: "Ambulância não encontrada" });
  }
});

// Endpoint para atualizar a localização (compatível com o ESP32)
app.get("/update", (req, res) => {
  if (req.query.lat && req.query.lon) {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const id = req.query.id || "AMB-001"; // ID padrão se não for fornecido
    const status = req.query.status || "disponível";
    
    // Verifica se a ambulância já existe
    if (!ambulancias[id]) {
      ambulancias[id] = {
        id: id,
        status: status,
        posicao: { lat, lon },
        ultimaAtualizacao: new Date().toISOString(),
        ultimoMovimento: new Date().toISOString(),
        emMovimento: false,
        rota: [[lat, lon]],
        ultimaPosicao: { lat, lon }
      };
    } else {
      // Verifica se a ambulância está em movimento
      const ultimaPosicao = ambulancias[id].ultimaPosicao;
      const distancia = calculateDistance(
        ultimaPosicao.lat, ultimaPosicao.lon,
        lat, lon
      );
      
      // Se a distância for maior que 10 metros, considera que está em movimento
      const emMovimento = distancia > 0.01; // 10 metros em km
      
      // Atualiza o timestamp do último movimento se estiver em movimento
      let ultimoMovimento = ambulancias[id].ultimoMovimento;
      if (emMovimento) {
        ultimoMovimento = new Date().toISOString();
      }
      
      // Atualiza a ambulância
      ambulancias[id].posicao = { lat, lon };
      ambulancias[id].status = status;
      ambulancias[id].ultimaAtualizacao = new Date().toISOString();
      ambulancias[id].ultimoMovimento = ultimoMovimento;
      ambulancias[id].emMovimento = emMovimento;
      ambulancias[id].rota.push([lat, lon]);
      ambulancias[id].ultimaPosicao = { lat, lon };
      
      // Limita o histórico da rota para os últimos 100 pontos
      if (ambulancias[id].rota.length > 100) {
        ambulancias[id].rota.shift();
      }
    }
    
    // Emite a atualização para todos os clientes conectados via Socket.IO
    io.emit('atualizacao-ambulancia', ambulancias[id]);
    
    console.log(`Nova localização para ${id}: ${lat}, ${lon}, status: ${status}, em movimento: ${ambulancias[id].emMovimento}`);
    res.send("Localização atualizada e transmitida em tempo real!");
  } else {
    res.status(400).send("Erro: Passe os parâmetros lat e lon.");
  }
});

// Função para calcular a distância entre dois pontos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distância em km
  return distance;
}

// Configuração do Socket.IO para conexões de clientes
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  // Envia os dados iniciais para o cliente que acabou de conectar
  Object.values(ambulancias).forEach(ambulancia => {
    socket.emit('atualizacao-ambulancia', ambulancia);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
