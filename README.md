# ROBOleto
Roboleto tem o objetivo baixar anexos de boletos PDF do GMAIL de acordo com as regras definidas no arquivo 
**config/configuration.json**, extrair as informações referentes ao boleto e inserir em uma planilha do google docs.

# Como utilizar:
  1 - Habilitar API google:
  https://developers.google.com/gmail/api/quickstart/nodejs
  baixar o arquivo gerado em:
    **credentials/google-auth.json**

  Gerenciar keys api:
  https://console.developers.google.com/apis/

2 - Criar o arquivo de configuração:
**config/configuration.json**
```json
{
    "appConfig": {
        "downloadPath": "tmp"
    },
    "googleSheet": {
        "spreadsheetId": "",
        "sheetName": ""
    },
    "gmailRules": [
        {
            "from": "email1@gmail.com",
            "removeLabels": ["UNREAD"],
            "addLabels": ["BOLETO"],
            "maxResults": 10,
            "query": "in:inbox is:unread filename:pdf"
        },
        {
            "from": "email2@gmail.com",
            "removeLabels": ["UNREAD"],
            "addLabels": [],
            "maxResults": 10,
            "query": "in:anywhere"
        }
    ]
}
```

  Gmail query filters:
  https://support.google.com/mail/answer/7190?hl=en
query examples:
  in:anywhere
  in:inbox
  in:spam
  is:unread
  subject:(dinner movie)
  after:2004/04/16 
  before:2004/04/18

Gmail apis reference
https://developers.google.com/gmail/api/v1/reference/users/messages/list


3 - Executar o node index.js
4 - Entrar com a key de autorização no terminar para gerar o arquivo de tokens



INFO:

Boleto Rules:
47 ou 48 dígitos separados em 5 campos:
Posição – 01-03 – Tamanho – 3 – Conteúdo – Identificação do banco
Posição – 04-04 – Tamanho – 1 – Conteúdo – Código de moeda (9 – Real)
Posição – 05-09 – Tamanho – 5 – Conteúdo – Cinco primeiras posições do campo livre (posições 20 a 24 do código de barras)
Posição – 10-10 – Tamanho – 1 – Conteúdo – Dígito verificador do primeiro campo
Posição – 11-20 – Tamanho – 10 – Conteúdo – 6ª a 15ª posições do campo livre (posições 25 a 34 do código de barras)
Posição – 21-21 – Tamanho – 1 – Conteúdo – Dígito verificador do segundo campo
Posição – 22-31 – Tamanho – 10 – Conteúdo – 16ª a 25ª posições do campo livre (posições 35 a 44 do código de barras)
Posição – 32-32 – Tamanho – 1 – Conteúdo – Dígito verificador do terceiro campo
Posição – 33-33 – Tamanho – 1 – Conteúdo – Dígito verificador geral (posição 5 do código de barras)
Posição – 34-47 – Tamanho – 14 – Conteúdo – Posições 34 a 37 – fator de vencimento (posições 6 a 9 do código de barras)
Posições 38 a 47 – valor nominal do título(posições 10 a 19 do código de barras

Layout Deve ser utilizado o tipo “2 de 5 intercalado”
  AAABC.CCCCX DDDDD.DDDDDY EEEEE.EEEEEZ K UUUUVVVVVVVVVV
     Campo 1     Campo 2      Campo 3   4 Campo 5

01 a 03    03    9(03)      Código do Banco na Câmara de Compensação = '001' 04 a 04 01 9(01) Código da Moeda = 9 (Real)
05 a 05    01    9(01)      Digito Verificador (DV) do código de Barras* 06 a 09 04 9(04) Fator de Vencimento **
10 a 19    10    9(08)V(2)  Valor 20 a 44 03 9(03) Campo Livre ***

datas base
1000 03/07/2000
1000 22/02/2025
