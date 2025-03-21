#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// Configuração Wi-Fi
const char* ssid = "Starlink_CIT";  // Substitua pelo seu SSID
const char* password = "Ufrr@2024Cit";  // Substitua pela sua senha Wi-Fi

// Configuração do sensor ECG (AD8232)
int loPinMinus = 4;  // LO- vai para D4
int loPinPlus = 2;   // LO+ vai para D2
int valorECG = 0;

String servidorURL = "http://192.168.1.147:5000/dados";  // URL do servidor

// Configuração do sensor de impressão digital R307
SoftwareSerial mySerial(16, 17);  // RX (pino 16), TX (pino 17) para o R307
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  // Inicializando comunicação Serial
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  // Espera até conectar ao Wi-Fi
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando ao WiFi...");
  }
  Serial.println("Conectado ao WiFi!");
  Serial.print("IP_Address: ");
  Serial.println(WiFi.localIP());

  // Inicializando o sensor de impressão digital
  mySerial.begin(57600);
  if (finger.begin()) {
    Serial.println("Sensor de impressão digital inicializado com sucesso.");
  } else {
    Serial.println("Erro ao inicializar o sensor de impressão digital.");
    while (1);  // Fica preso aqui caso o sensor não seja inicializado
  }

  // Verificação do número de impressões digitais armazenadas
  finger.getTemplateCount();
  Serial.print("Número de impressões digitais armazenadas: ");
  Serial.println(finger.templateCount);
}

void loop() {
  // Leitura do ECG (valores do LO- e LO+)
  int valorLOminus = analogRead(loPinMinus);  // Leitura de LO- (D4)
  int valorLOplus = analogRead(loPinPlus);    // Leitura de LO+ (D2)
  
  // A média entre os dois pode ser uma maneira de combinar os sinais
  valorECG = (valorLOminus + valorLOplus) / 2;

  // Exibindo os valores de ECG no Serial Monitor
  Serial.print("LO- (D4): ");
  Serial.print(valorLOminus);
  Serial.print(" | LO+ (D2): ");
  Serial.print(valorLOplus);
  Serial.print(" | Valor ECG: ");
  Serial.println(valorECG);

  // Verificando o sensor de impressão digital
  int fingerID = getFingerprintID();
  if (fingerID >= 0) {
    Serial.print("Impressão digital detectada! ID: ");
    Serial.println(fingerID);
  } else {
    Serial.println("Nenhuma impressão digital detectada.");
  }

  // Criar JSON com os dados do ECG e ID da impressão digital
  String jsonPayload = "{\"ecg\": " + String(valorECG) + ", \"fingerprint_id\": " + String(fingerID) + "}";

  // Enviar os dados para o servidor
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
  }

  delay(1000);  // Aguarda 1 segundo antes de realizar a próxima tentativa
}

// Função para obter o ID da impressão digital
int getFingerprintID() {
  int p = finger.getImage();
  if (p != FINGERPRINT_OK) {
    return -1;  // Nenhuma impressão digital encontrada
  }

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) {
    return -1;  // Erro na conversão da imagem
  }

  p = finger.fingerSearch();
  if (p != FINGERPRINT_OK) {
    return -1;  // Nenhuma impressão digital registrada
  }

  return finger.fingerID;  // Retorna o ID da impressão digital detectada
}
