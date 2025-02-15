#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// =====================================================
// CONFIGURAÇÃO DO WIFI - Substitua com os seus dados!
const char* ssid = "Starlink_CIT";
const char* wifi_password = "Ufrr@2024Cit";

// =====================================================
// CONFIGURAÇÃO DO MQTT (HiveMQ Cloud)
const char* mqtt_server = "85858620402e432ca7ff65254eb2c365.s1.eu.hivemq.cloud";
const int mqtt_port = 8883; // Porta TLS
const char* mqtt_user = "hivemq.webclient.1739629436099";
const char* mqtt_password = "g1!0dQKbj7X2?C*Yp:So";

// =====================================================
// OBJETOS PARA CONEXÃO
WiFiClientSecure wifiClient;    // Cliente WiFi seguro para TLS
PubSubClient client(wifiClient);  // Cliente MQTT

// =====================================================
// DEFINIÇÃO DOS PINOS
// Sensores ultrassônicos
#define TRIG1_PIN 18      // Sensor Ultrassônico 1 (Borda esquerda)
#define ECHO1_PIN 19      
#define TRIG2_PIN 21      // Sensor Ultrassônico 2 (Borda direita)
#define ECHO2_PIN 22      

// LED de alerta
#define LED_PIN 4         

// Sensores PIR
#define PIR1_PIN 33       // PIR Sensor 1 (D33)
#define PIR2_PIN 32       // PIR Sensor 2 (D32)

// =====================================================
// OUTRAS CONFIGURAÇÕES
#define TIMEOUT 30000     // Timeout para a leitura dos ultrassônicos (30 ms)

float distance1, distance2;  // Variáveis para armazenar as distâncias

// =====================================================
// FUNÇÃO: reconectaMQTT()
// Tenta reconectar ao broker MQTT se a conexão for perdida.
void reconectaMQTT() {
  while (!client.connected()) {
    Serial.print("Tentando conectar ao MQTT...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println(" conectado!");
    } else {
      Serial.print(" Falha na conexão, rc=");
      Serial.print(client.state());
      Serial.println(" Tentando novamente em 5 segundos.");
      delay(5000);
    }
  }
}

// =====================================================
// FUNÇÃO: getDistance()
// Mede a distância utilizando um sensor ultrassônico.
float getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  unsigned long duration = pulseIn(echoPin, HIGH, TIMEOUT);
  
  if (duration == 0 || duration >= TIMEOUT - 1000) {
    return 9999.0; // Valor alto indicando "sem objeto detectado"
  }
  
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

// =====================================================
// SETUP
void setup() {
  Serial.begin(115200);
  
  // Conecta ao WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, wifi_password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Conectado!");
  
  // Configura o cliente seguro (para testes, não valida o certificado)
  wifiClient.setInsecure();
  
  // Configura o broker MQTT
  client.setServer(mqtt_server, mqtt_port);
  
  // Configuração dos pinos dos sensores ultrassônicos
  pinMode(TRIG1_PIN, OUTPUT);
  pinMode(ECHO1_PIN, INPUT);
  pinMode(TRIG2_PIN, OUTPUT);
  pinMode(ECHO2_PIN, INPUT);
  
  // Configuração dos sensores PIR com pull-down para evitar pinos flutuantes
  pinMode(PIR1_PIN, INPUT_PULLDOWN);
  pinMode(PIR2_PIN, INPUT_PULLDOWN);
  
  // Configuração do LED de alerta
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("Iniciando monitoramento dos sensores...");
  Serial.println("Aguarde o tempo de estabilização dos sensores PIR (aprox. 30 segundos)...");
}

// =====================================================
// LOOP
void loop() {
  // Verifica e reconecta ao MQTT se necessário
  if (!client.connected()) {
    reconectaMQTT();
  }
  client.loop();
  
  // Mede as distâncias dos sensores ultrassônicos
  distance1 = getDistance(TRIG1_PIN, ECHO1_PIN);
  distance2 = getDistance(TRIG2_PIN, ECHO2_PIN);
  
  // Lê o estado dos sensores PIR (HIGH indica detecção de movimento)
  int pir1State = digitalRead(PIR1_PIN);
  int pir2State = digitalRead(PIR2_PIN);
  
  // Define as condições de alerta
  bool ultrasonicAlert = (distance1 <= 20 || distance2 <= 20);
  bool pirAlert = (pir1State == HIGH || pir2State == HIGH);
  
  // Se houver alerta (ou seja, se o LED acender) envia os dados via MQTT
  if (ultrasonicAlert || pirAlert) {
    digitalWrite(LED_PIN, HIGH);
    
    // Monta a mensagem com base nos alertas acionados
    String message = "";
    if (ultrasonicAlert) {
      message += "ALERTA: Bebê está muito perto das bordas! Ultrassônico - Sensor 1: ";
      message += String(distance1, 2);
      message += " cm, Sensor 2: ";
      message += String(distance2, 2);
      message += " cm";
    }
    if (pirAlert) {
      if (message.length() > 0) {
        message += " | ";
      }
      message += "ALERTA: Movimento detectado pelos sensores PIR. PIR1: ";
      message += String(pir1State);
      message += ", PIR2: ";
      message += String(pir2State);
    }
    
    Serial.println(message);
    client.publish("sensors/alert", message.c_str());
  } 
  else {
    digitalWrite(LED_PIN, LOW);
    // Se o LED estiver apagado, nenhum dado é enviado
  }
  
  delay(500);  // Aguarda 500 ms para a próxima leitura.
}
