#include <WiFi.h> 
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>
#include <HardwareSerial.h>

// Configurações de WiFi e servidor
const char* ssid = "Starlink_CIT";           // Substitua pelo seu SSID
const char* password = "Ufrr@2024Cit";         // Substitua pela sua senha Wi-Fi
String servidorURL = "http://192.168.1.231:5000/dados";  // URL do servidor

// Configurações do sensor ECG
int ecgPin = 34;      // Pino de leitura do ECG
int loPinPlus = 2;    // Pino para LO+
int loPinMinus = 4;   // Pino para LO-

// Configurações do sensor biométrico
HardwareSerial mySerial(1);  // Usando UART1 no ESP32 (GPIO16 e GPIO17)
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Inicializa o WiFi
  WiFi.begin(ssid, password);
  Serial.println("Conectando ao WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
  }
  Serial.println("Conectado ao WiFi!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Configura os pinos do ECG
  pinMode(loPinPlus, INPUT);
  pinMode(loPinMinus, INPUT);

  // Inicializa o sensor de digital
  mySerial.begin(57600, SERIAL_8N1, 16, 17);
  finger.begin(57600);
  if (!finger.verifyPassword()) {
    Serial.println("Erro: Sensor de biometria não encontrado!");
    while (1) { delay(100); }
  }
  Serial.println("Sensor de biometria inicializado com sucesso!");
}

void loop() {
  Serial.println("Posicione o dedo para autenticação...");
  int id = verificarDigital();

  if (id > 0) {
    Serial.print("Usuário autenticado! ID: ");
    Serial.println(id);
    
    // Após a autenticação, libera a leitura do ECG por 10 segundos
    unsigned long inicioECG = millis();
    while (millis() - inicioECG < 10000) {
      lerECG();
      delay(100);  // Delay entre as leituras
    }
    Serial.println("Sessão de leitura do ECG finalizada.");
  } else {
    Serial.println("Falha na autenticação ou dedo não reconhecido.");
    delay(2000);
  }
}

int verificarDigital() {
  int p = 0;
  
  // Aguarda até que o dedo seja detectado
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p == FINGERPRINT_NOFINGER) {
      // Nenhum dedo detectado; continua esperando
    } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
      Serial.println("Erro na comunicação com o sensor.");
      return -1;
    } else {
      Serial.print("Erro desconhecido: ");
      Serial.println(p);
      return -1;
    }
    delay(100);
  }

  // Converte a imagem para características (armazena no slot 1)
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.print("Erro ao converter a imagem: ");
    Serial.println(p);
    return -1;
  }

  // Procura correspondência no banco de dados do sensor
  p = finger.fingerFastSearch();
  if (p == FINGERPRINT_OK) {
    return finger.fingerID;  // Retorna o ID do usuário autenticado
  } else {
    Serial.print("Nenhuma correspondência encontrada (código ");
    Serial.print(p);
    Serial.println(").");
    return -1;
  }
}

void lerECG() {
  int valorECG = analogRead(ecgPin);
  Serial.println("Valor ECG: " + String(valorECG));

  // Leitura dos pinos LO+ e LO-
  int loStatusPlus = digitalRead(loPinPlus);
  int loStatusMinus = digitalRead(loPinMinus);
  Serial.println("LO+ Status: " + String(loStatusPlus));
  Serial.println("LO- Status: " + String(loStatusMinus));

  // Cria o payload JSON com o valor do ECG
  String jsonPayload = "{\"ecg\": " + String(valorECG) + "}";

  // Envia os dados para o servidor se estiver conectado ao WiFi
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(servidorURL);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.println("Dados enviados com sucesso!");
    } else {
      Serial.println("Erro ao enviar dados: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("WiFi desconectado, não foi possível enviar os dados.");
  }
}