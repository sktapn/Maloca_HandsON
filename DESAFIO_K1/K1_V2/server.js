const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = socketIo(server)

const ambulancias = {
  "AMB-001": {
    id: "AMB-001",
    status: "disponível",
    posicao: { lat: 2.8235, lon: -60.6758 },
    ultimaAtualizacao: new Date().toISOString(),
    ultimoMovimento: new Date().toISOString(),
    emMovimento: false,
    rota: [[2.8235, -60.6758]],
    ultimaPosicao: { lat: 2.8235, lon: -60.6758 },
  },
}

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
        :root {
          --primary: #e11d48;
          --primary-dark: #be123c;
          --primary-light: #fb7185;
          --secondary: #f43f5e;
          --accent: #fda4af;
          --background: #ffffff;
          --foreground: #0f172a;
          --card: #ffffff;
          --card-foreground: #0f172a;
          --border: #e2e8f0;
          --muted: #f1f5f9;
          --muted-foreground: #64748b;
          --destructive: #ef4444;
          --destructive-foreground: #ffffff;
          --success: #10b981;
          --warning: #f59e0b;
        }
        
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background-color: #f8fafc;
          color: var(--foreground);
        }
        
        .container { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        
        header { 
          background-color: var(--primary); 
          color: white; 
          padding: 15px 20px; 
          border-radius: 8px; 
          margin-bottom: 20px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.1), 0 2px 4px -1px rgba(225, 29, 72, 0.06);
        }
        
        h1 { 
          margin: 0; 
          font-size: 1.8rem;
          display: flex;
          align-items: center;
        }
        
        h1:before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 24px;
          margin-right: 10px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 4v16h-12a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h12z'%3E%3C/path%3E%3Cpath d='M19 16H7a2 2 0 0 1-2-2'%3E%3C/path%3E%3Cpath d='M12 4v4'%3E%3C/path%3E%3Cpath d='M10 6h4'%3E%3C/path%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
        }
        
        .status-badge { 
          background-color: var(--success); 
          color: white; 
          padding: 5px 10px; 
          border-radius: 20px; 
          font-size: 0.9rem; 
          display: flex; 
          align-items: center; 
        }
        
        .status-badge.offline { 
          background-color: var(--muted-foreground); 
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
          background-color: var(--card); 
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
          color: var(--muted-foreground);
        }
        
        .tab.active { 
          background-color: #fff1f2; 
          border-bottom: 3px solid var(--primary); 
          color: var(--primary); 
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
          border: 1px solid var(--border);
        }
        
        .info-panel { 
          width: 300px; 
          background-color: var(--card); 
          border-radius: 8px; 
          padding: 15px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          max-height: 600px; 
          overflow-y: auto; 
          border: 1px solid var(--border);
        }
        
        .ambulance-card { 
          margin-bottom: 15px; 
          padding: 15px; 
          border-radius: 8px; 
          background-color: var(--muted); 
          border-left: 4px solid var(--primary); 
          cursor: pointer; 
          transition: all 0.2s ease; 
        }
        
        .ambulance-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
        }
        
        .ambulance-card.selected { 
          background-color: #fff1f2; 
          border-left-color: var(--primary); 
        }
        
        .ambulance-card.paused { 
          border-left-color: var(--warning); 
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
          color: var(--foreground);
        }
        
        .ambulance-status { 
          font-size: 0.8rem; 
          padding: 3px 8px; 
          border-radius: 12px; 
          background-color: var(--success); 
          color: white; 
        }
        
        .ambulance-status.em-rota { 
          background-color: var(--primary); 
        }
        
        .ambulance-status.no-hospital { 
          background-color: var(--warning); 
        }
        
        .ambulance-details { 
          font-size: 0.9rem; 
          color: var(--muted-foreground); 
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
          background-color: var(--success); 
        }
        
        .stopped { 
          background-color: var(--warning); 
        }
        
        .no-ambulances { 
          padding: 20px; 
          text-align: center; 
          color: var(--muted-foreground); 
          font-style: italic; 
        }
        
        .stats-container { 
          margin-top: 20px; 
          padding: 15px; 
          background-color: var(--card); 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
          border: 1px solid var(--border);
        }
        
        .stats-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 15px; 
          border-bottom: 1px solid var(--border);
          padding-bottom: 10px;
        }
        
        .stats-title { 
          font-size: 1.2rem; 
          font-weight: 600; 
          color: var(--foreground); 
          margin: 0; 
          display: flex;
          align-items: center;
        }
        
        .stats-title:before {
          content: '';
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 8px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e11d48' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3v18h18'/%3E%3Cpath d='M18.7 8l-5.1 5.2-2.8-2.7L7 14.3'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
        }
        
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 15px; 
        }
        
        .stat-card { 
          background-color: var(--muted); 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center; 
          border: 1px solid var(--border);
        }
        
        .stat-value { 
          font-size: 1.8rem; 
          font-weight: 700; 
          color: var(--primary); 
          margin: 5px 0; 
        }
        
        .stat-label { 
          font-size: 0.9rem; 
          color: var(--muted-foreground); 
        }
        
        .ambulance-marker-icon {
          background-color: var(--primary);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.3);
        }
        
        .ambulance-marker-icon.paused {
          background-color: var(--warning);
        }
        
        .pulse-ring {
          border: 3px solid var(--primary);
          border-radius: 50%;
          height: 24px;
          width: 24px;
          position: absolute;
          left: -6px;
          top: -6px;
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.5);
            opacity: 0.5;
          }
          80%, 100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }
        
        .refresh-button {
          background-color: var(--primary);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color 0.2s;
        }
        
        .refresh-button:hover {
          background-color: var(--primary-dark);
        }
        
        .refresh-button:before {
          content: '';
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 6px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 2v6h-6'/%3E%3Cpath d='M3 12a9 9 0 0 1 15-6.7L21 8'/%3E%3Cpath d='M3 22v-6h6'/%3E%3Cpath d='M21 12a9 9 0 0 1-15 6.7L3 16'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
        }
        
        .last-update-info {
          font-size: 0.8rem;
          color: var(--muted-foreground);
          text-align: right;
          margin-top: 5px;
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
          <div class="tab" data-tab="paused">Ambulâncias Paradas</div>
        </div>
        
        <div id="active-tab" class="tab-content active">
          <div class="map-container">
            <div id="active-map" class="map"></div>
            <div class="info-panel">
              <div class="stats-header">
                <h3 class="stats-title">Ambulâncias Ativas</h3>
                <button id="refresh-active" class="refresh-button">Atualizar</button>
              </div>
              <div id="active-ambulances-list">
                <div class="no-ambulances">Nenhuma ambulância ativa no momento</div>
              </div>
              <div class="last-update-info" id="active-last-update">Última atualização: agora</div>
            </div>
          </div>
        </div>
        
        <div id="paused-tab" class="tab-content">
          <div class="map-container">
            <div id="paused-map" class="map"></div>
            <div class="info-panel">
              <div class="stats-header">
                <h3 class="stats-title">Ambulâncias Paradas</h3>
                <button id="refresh-paused" class="refresh-button">Atualizar</button>
              </div>
              <div id="paused-ambulances-list">
                <div class="no-ambulances">Nenhuma ambulância parada no momento</div>
              </div>
              <div class="last-update-info" id="paused-last-update">Última atualização: agora</div>
            </div>
          </div>
        </div>
        
        <div class="stats-container">
          <div class="stats-header">
            <h2 class="stats-title">Estatísticas Gerais</h2>
            <div class="last-update-info" id="stats-last-update">Atualizado em tempo real</div>
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
              <div class="stat-label">Ambulâncias Paradas</div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        const socket = io();
        let activeMap, pausedMap;
        let markers = {};
        let routes = {};
        let selectedAmbulanceId = null;
        let ambulancesData = {};
        let lastUpdateTime = new Date();
        
        // Função para inicializar os mapas
        function initMaps() {
          const boaVistaCoords = [2.8235, -60.6758];
          
          // Inicializa o mapa de ambulâncias ativas
          activeMap = L.map('active-map').setView(boaVistaCoords, 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(activeMap);
          
          // Inicializa o mapa de ambulâncias em pausa
          pausedMap = L.map('paused-map').setView(boaVistaCoords, 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(pausedMap);
          
          // Carrega os dados iniciais
          fetchAmbulancesData();
          
          // Configura os botões de atualização
          document.getElementById('refresh-active').addEventListener('click', fetchAmbulancesData);
          document.getElementById('refresh-paused').addEventListener('click', fetchAmbulancesData);
        }
        
        // Função para buscar dados das ambulâncias
        function fetchAmbulancesData() {
          fetch('/ambulancias')
            .then(response => response.json())
            .then(data => {
              ambulancesData = data;
              updateAmbulancesDisplay();
              updateLastUpdateTime();
            })
            .catch(error => console.error('Erro ao carregar dados:', error));
        }
        
        // Função para atualizar o tempo da última atualização
        function updateLastUpdateTime() {
          lastUpdateTime = new Date();
          document.getElementById('active-last-update').textContent = 'Última atualização: agora';
          document.getElementById('paused-last-update').textContent = 'Última atualização: agora';
          document.getElementById('stats-last-update').textContent = 'Atualizado em tempo real';
          
          // Inicia o contador de tempo desde a última atualização
          startUpdateCounter();
        }
        
        // Contador para "tempo desde a última atualização"
        let updateCounterInterval;
        function startUpdateCounter() {
          clearInterval(updateCounterInterval);
          updateCounterInterval = setInterval(() => {
            let seconds = Math.floor((new Date() - lastUpdateTime) / 1000);
            const timeText = formatTimeSinceShort(seconds);
            
            document.getElementById('active-last-update').textContent = \`Última atualização: \${timeText}\`;
            document.getElementById('paused-last-update').textContent = \`Última atualização: \${timeText}\`;
            document.getElementById('stats-last-update').textContent = \`Última atualização: \${timeText}\`;
          }, 1000);
        }
        
        // Formata o tempo decorrido de forma curta
        function formatTimeSinceShort(seconds) {
          if (seconds < 60) return \`\${seconds} segundos atrás\`;
          let minutes = Math.floor(seconds / 60);
          if (minutes < 60) return \`\${minutes} minutos atrás\`;
          let hours = Math.floor(minutes / 60);
          return \`\${hours} horas atrás\`;
        }
        
        // Função para criar um ícone de marcador personalizado
        function createMarkerIcon(status, isMoving) {
          const isPaused = !isMoving;
          const html = \`
            <div class="ambulance-marker-icon \${isPaused ? 'paused' : ''}">
              \${isMoving ? '<div class="pulse-ring"></div>' : ''}
            </div>
          \`;
          
          return L.divIcon({
            html: html,
            className: 'custom-marker',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
        }
        
        // Função para atualizar a exibição das ambulâncias
        function updateAmbulancesDisplay() {
          document.getElementById('active-ambulances-list').innerHTML = '';
          document.getElementById('paused-ambulances-list').innerHTML = '';
          
          let activeCount = 0;
          let pausedCount = 0;
          
          Object.values(ambulancesData).forEach(ambulancia => {
            const isMoving = ambulancia.emMovimento;
            const isPaused = !isMoving;
            
            if (isPaused) {
              pausedCount++;
              updateAmbulanceMarker(ambulancia, isMoving, true);
              addToAmbulanceList(ambulancia, isMoving, true);
            } else {
              activeCount++;
              updateAmbulanceMarker(ambulancia, isMoving, false);
              addToAmbulanceList(ambulancia, isMoving, false);
            }
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
              '<div class="no-ambulances">Nenhuma ambulância parada no momento</div>';
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
              <div style="text-align: center;">
                <strong style="color: #e11d48; font-size: 1.1rem;">Ambulância \${ambulancia.id}</strong><br>
                <span style="color: #64748b; font-size: 0.9rem;">Status: \${ambulancia.status}</span><br>
                <span style="color: #64748b; font-size: 0.9rem;">\${isMoving ? 'Em movimento' : 'Parada há: ' + formatTimeSince(ambulancia.ultimoMovimento)}</span>
              </div>
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
            routes[ambulancia.id] = L.polyline(ambulancia.rota, { 
              color: '#e11d48', 
              weight: 3,
              opacity: 0.7,
              dashArray: '5, 10'
            }).addTo(activeMap);
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
          const now = new Date();
          let seconds = Math.floor((now - date) / 1000);
          if (seconds < 0) seconds = 0;
          
          if (seconds < 60) return \`\${seconds} segundos\`;
          let minutes = Math.floor(seconds / 60);
          if (minutes < 60) return \`\${minutes} minutos\`;
          let hours = Math.floor(minutes / 60);
          if (hours < 24) return \`\${hours} horas\`;
          const days = Math.floor(hours / 24);
          return \`\${days} dias\`;
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
          console.log('[Client] Recebida atualização:', ambulancia);
          ambulancesData[ambulancia.id] = ambulancia;
          updateAmbulancesDisplay();
          updateLastUpdateTime();
        });
        
        // Inicializa os mapas quando a página carregar
        window.onload = initMaps;
        
        // Atualiza a exibição a cada segundo para manter os tempos atualizados
        setInterval(() => {
          if (Object.keys(ambulancesData).length > 0) {
            updateAmbulancesDisplay();
          }
        }, 1000);
      </script>
    </body>
    </html>
  `)
})

app.get("/ambulancias", (req, res) => {
  res.json(ambulancias)
})

app.get("/ambulancias/:id", (req, res) => {
  const id = req.params.id
  if (ambulancias[id]) {
    res.json(ambulancias[id])
  } else {
    res.status(404).json({ erro: "Ambulância não encontrada" })
  }
})

app.get("/update", (req, res) => {
  if (req.query.lat && req.query.lon && req.query.id) {
    const lat = Number.parseFloat(req.query.lat)
    const lon = Number.parseFloat(req.query.lon)
    const id = req.query.id
    const status = req.query.status || "disponível"

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).send("Erro: Latitude ou longitude inválidas.")
    }

    const now = new Date().toISOString()

    if (!ambulancias[id]) {
      ambulancias[id] = {
        id: id,
        status: status,
        posicao: { lat, lon },
        ultimaAtualizacao: now,
        ultimoMovimento: now,
        emMovimento: false,
        rota: [[lat, lon]],
        ultimaPosicao: { lat, lon },
      }
    } else {
      const ultimaPosicao = ambulancias[id].ultimaPosicao
      const distancia = calculateDistance(ultimaPosicao.lat, ultimaPosicao.lon, lat, lon)
      const emMovimento = distancia > 0.01

      ambulancias[id].posicao = { lat, lon }
      ambulancias[id].status = status
      ambulancias[id].ultimaAtualizacao = now
      ambulancias[id].ultimoMovimento = emMovimento ? now : ambulancias[id].ultimoMovimento
      ambulancias[id].emMovimento = emMovimento
      ambulancias[id].rota.push([lat, lon])
      ambulancias[id].ultimaPosicao = { lat, lon }

      if (ambulancias[id].rota.length > 100) {
        ambulancias[id].rota.shift()
      }
    }

    console.log(
      `[Server] ID: ${id}, ultimaAtualizacao: ${ambulancias[id].ultimaAtualizacao}, ultimoMovimento: ${ambulancias[id].ultimoMovimento}, emMovimento: ${ambulancias[id].emMovimento}`,
    )
    io.emit("atualizacao-ambulancia", ambulancias[id])
    res.send("Localização atualizada e transmitida em tempo real!")
  } else {
    res.status(400).send("Erro: Parâmetros lat, lon e id são obrigatórios.")
  }
})

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

io.on("connection", (socket) => {
  console.log("Novo cliente conectado")
  Object.values(ambulancias).forEach((ambulancia) => {
    socket.emit("atualizacao-ambulancia", ambulancia)
  })
  socket.on("disconnect", () => {
    console.log("Cliente desconectado")
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))

