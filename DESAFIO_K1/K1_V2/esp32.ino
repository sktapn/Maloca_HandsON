#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>

// Configuração do Wi-Fi
const char* ssid = "jacques";
const char* password = "s2023002";

// Configuração do servidor
const char* serverUrl = "http://kindly-classic-passbook.glitch.me";
const char* ambulanceId = "AMB-001";  // ID da ambulância

// Configuração do GPS
#define RXD2 16
#define TXD2 17
#define GPS_BAUD 9600
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

// Intervalo de envio reduzido para atualizações mais frequentes
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 2000;  // Enviar a cada 2 segundos para maior fluidez

// LED para indicação visual
#define LED_PIN 2

// Botão para alternar status (opcional)
#define STATUS_BUTTON_PIN 4

// Variáveis para controle de status
const char* statusOptions[] = {"disponível", "em-rota", "no-hospital"};
int currentStatusIndex = 0;
unsigned long lastButtonPress = 0;
const unsigned long debounceTime = 300;  // Tempo de debounce para o botão

void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
    pinMode(STATUS_BUTTON_PIN, INPUT_PULLUP);  // Botão com resistor pull-up interno
    
    // Inicia a comunicação com o módulo GPS
    gpsSerial.begin(GPS_BAUD, SERIAL_8N1, RXD2, TXD2);
    Serial.println("Módulo GPS iniciado");
    
    // Conecta ao Wi-Fi
    connectToWiFi();
}

void loop() {
    // Verifica o botão de status (com debounce)
    if (digitalRead(STATUS_BUTTON_PIN) == LOW && millis() - lastButtonPress > debounceTime) {
        lastButtonPress = millis();
        currentStatusIndex = (currentStatusIndex + 1) % 3;  // Alterna entre os 3 status
        Serial.print("Status alterado para: ");
        Serial.println(statusOptions[currentStatusIndex]);
        
        // Pisca o LED para indicar mudança de status
        for (int i = 0; i < currentStatusIndex + 1; i++) {
            digitalWrite(LED_PIN, HIGH);
            delay(200);
            digitalWrite(LED_PIN, LOW);
            delay(200);
        }
    }
    
    // Lê dados do GPS
    while (gpsSerial.available() > 0) {
        gps.encode(gpsSerial.read());
    }
    
    // Verifica se é hora de enviar dados
    unsigned long currentTime = millis();
    if (currentTime - lastSendTime >= sendInterval) {
        lastSendTime = currentTime;
        
        // Verifica se temos dados válidos do GPS
        if (gps.location.isValid()) {
            float lat = gps.location.lat();
            float lon = gps.location.lng();
            
            // Exibe a localização no monitor serial
            Serial.print("Latitude: "); Serial.println(lat, 6);
            Serial.print("Longitude: "); Serial.println(lon, 6);
            
            // Pisca o LED para indicar envio
            digitalWrite(LED_PIN, HIGH);
            
            // Envia os dados para o servidor
            if (WiFi.status() == WL_CONNECTED) {
                sendLocationData(lat, lon, statusOptions[currentStatusIndex]);
            } else {
                Serial.println("WiFi desconectado. Tentando reconectar...");
                connectToWiFi();
            }
            
            digitalWrite(LED_PIN, LOW);
        } else {
            Serial.println("Aguardando coordenadas válidas do GPS...");
            
            // Para fins de teste, você pode usar coordenadas fixas
            /*
            float lat = 2.8235 + (random(-100, 100) / 10000.0);  // Pequena variação aleatória
            float lon = -60.6758 + (random(-100, 100) / 10000.0);
            Serial.print("Usando coordenadas de teste: ");
            Serial.print(lat, 6); Serial.print(", "); Serial.println(lon, 6);
            sendLocationData(lat, lon, statusOptions[currentStatusIndex]);
            */
        }
    }
}

// Função para conectar ao WiFi
void connectToWiFi() {
    Serial.print("Conectando ao WiFi");
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        Serial.print(".");
        attempts++;
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Conectado!");
        Serial.print("Endereço IP: ");
        Serial.println(WiFi.localIP());
        digitalWrite(LED_PIN, HIGH);
        delay(500);
        digitalWrite(LED_PIN, LOW);
    } else {
        Serial.println("\nFalha ao conectar ao WiFi. Reiniciando...");
        ESP.restart();
    }
}

// Função para enviar dados de localização
void sendLocationData(float lat, float lon, const char* status) {
    HTTPClient http;
    
    // Cria a URL com os parâmetros
    String url = String(serverUrl) + "/update?lat=" + String(lat, 6) + 
                 "&lon=" + String(lon, 6) + 
                 "&id=" + String(ambulanceId) +
                 "&status=" + String(status);
    
    // Exibe a URL que será enviada
    Serial.println("URL Enviada: " + url);

    // Inicia a requisição HTTP GET
    http.begin(url);
    int httpCode = http.GET();
    
    if (httpCode > 0) {
        String payload = http.getString();
        Serial.println("Localização enviada com sucesso!");
    } else {
        Serial.println("Falha ao enviar localização: " + http.errorToString(httpCode));
    }
    
    http.end();
}
