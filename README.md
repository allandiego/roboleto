# ROBOleto

Roboleto tem o objetivo baixar anexos de boletos PDF do GMAIL de acordo com as regras definidas no arquivo 
**config/configuration.json**, extrair as informações referentes ao boleto e inserir em uma planilha do google docs.

## Como Utilizar
### Instalação
Instalar NodeJS: 
* [NodeJS](https://nodejs.org/)

### Clonar o repositório
https://github.com/allandiego/roboleto/archive/master.zip

ou
```
git clone https://github.com/allandiego/roboleto.git
```

### Dependências
De dentro da pasta do projeto instalar as depenências de pacotes

```
npm install
```

## Habilitar API Google
Para habilitar a API: https://developers.google.com/gmail/api/quickstart/nodejs

Para gerenciar keys api: https://console.developers.google.com/apis/

Baixar o arquivo gerado em:
    **credentials/google-auth.json**

exemplo de arquivo:
```json
{
    "installed": {
        "client_id": "",
        "project_id": "",
        "client_secret": "",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "redirect_uris": [
            "urn:ietf:wg:oauth:2.0:oob",
            "http://localhost"
        ]
    }
}
```
## Planilha do Google
Criar a planilha de destino das informações no google docs com as seguintes colunas:

Vencimento|Banco|Valor|Código Barras|Descrição|Arquivo|Código Barras Formatado
--- | --- | ---| ---| ---| ---| ---

Copiar o ID da planilha criada para inserir no arquivo de configurações
![alt text](https://github.com/allandiego/roboleto/blob/master/sheet-id.png "spreadsheet id")


### Arquivo de Configuração
Criar o arquivo de configuração conforme exemplo:
**config/configuration.json**
```json
{
    "appConfig": {
        "downloadPath": "tmp"
    },
    "googleSheet": {
        "spreadsheetId": "",
        "sheetName": "Página 1"
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

**Gmail query filters**:
*  https://support.google.com/mail/answer/7190?hl=en
* query examples:
*  in:anywhere
*  in:inbox
*  in:spam
*  is:unread
*  subject:(dinner movie)
*  after:2004/04/16 
*  before:2004/04/18

**Labels**
estas labels serão removidas da mensagem após o processamento, nesse exmplo o email e marcado como "JÁ LIDO"
```json
"removeLabels": ["UNREAD"]
```

estas labels serão adicionadas a mensagem após o processamento, nesse exmplo a mensagem será marcada com a label BOLETO
```json
"addLabels": ["BOLETO"],
```


### Executar o robô
De dentro da pasta do projeto executar
```
node index.js
```

Na primeira execução uma janela do browser se abrirá com o link solicitando a autorização do google com o token gerado, copie e cole o token no console para o arquivo **credentials/google-token.json** ser gerado






### Informações complementares do funcionamento dos boletos
* 47 ou 48 dígitos separados em 5 campos:
* Posição – 01-03 – Tamanho – 3 – Conteúdo – Identificação do banco
* Posição – 04-04 – Tamanho – 1 – Conteúdo – Código de moeda (9 – Real)
* Posição – 05-09 – Tamanho – 5 – Conteúdo – Cinco primeiras posições do campo livre (posições 20 a 24 do código de barras)
* Posição – 10-10 – Tamanho – 1 – Conteúdo – Dígito verificador do primeiro campo
* Posição – 11-20 – Tamanho – 10 – Conteúdo – 6ª a 15ª posições do campo livre (posições 25 a 34 do código de barras)
* Posição – 21-21 – Tamanho – 1 – Conteúdo – Dígito verificador do segundo campo
* Posição – 22-31 – Tamanho – 10 – Conteúdo – 16ª a 25ª posições do campo livre (posições 35 a 44 do código de * barras)
* Posição – 32-32 – Tamanho – 1 – Conteúdo – Dígito verificador do terceiro campo
* Posição – 33-33 – Tamanho – 1 – Conteúdo – Dígito verificador geral (posição 5 do código de barras)
* Posição – 34-47 – Tamanho – 14 – Conteúdo – Posições 34 a 37 – fator de vencimento (posições 6 a 9 do código de * barras)
* Posições 38 a 47 – valor nominal do título(posições 10 a 19 do código de barras

* Layout Deve ser utilizado o tipo “2 de 5 intercalado”
*   AAABC.CCCCX DDDDD.DDDDDY EEEEE.EEEEEZ K UUUUVVVVVVVVVV
*      Campo 1     Campo 2      Campo 3   4 Campo 5

* 01 a 03    03    9(03)      Código do Banco na Câmara de Compensação = '001' 04 a 04 01 9(01) Código da Moeda = 9 (Real)
* 05 a 05    01    9(01)      Digito Verificador (DV) do código de Barras* 06 a 09 04 9(04) Fator de Vencimento **
* 10 a 19    10    9(08)V(2)  Valor 20 a 44 03 9(03) Campo Livre ***

* datas base
* 1000 03/07/2000
* 1000 22/02/2025
