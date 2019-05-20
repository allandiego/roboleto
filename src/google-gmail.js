const google = require('googleapis').google
const gmail = google.gmail({version: 'v1'})
const fs = require('fs')
const path = require('path')
const authClient = require('../src/google-auth.js')
const CONFIG_PATH = './config/configuration.json'

async function robot() {
  const {appConfig, gmailRules} = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  await authenticateWithOAuth()
  await fetchFilterRules(gmailRules)

  async function authenticateWithOAuth() {
    const OAuthClient = await authClient.getAuthenticatedClient()
    await setGlobalGoogleAuthentication(OAuthClient)
    function setGlobalGoogleAuthentication(OAuthClient) {
      google.options({ auth: OAuthClient })
    }
  }

  async function fetchFilterRules(gmailRules) {
    console.log(`> [google-gmail]: Fetching configuration rules`)
    for (let gmailRule of gmailRules) {
      console.log(`> [google-gmail]:   From (${gmailRule.from})`)
      const messagesList = await listMessages(gmailRule)
      if (messagesList.length >= 1) {
        const messagesData = await fetchMessagesData(messagesList)
        const messagesAttachmentsData = await fetchMessagesAttachmentsData(messagesData)
        await fetchAndDownloadAttachments(messagesAttachmentsData, appConfig.downloadPath, gmailRule)
      }
    }
    console.log('> [google-gmail]: Done')
  }

  async function fetchMessagesData(messagesList) {
    const messagesData = []
    for (let message of messagesList) {
      messagesData.push(await getMessage(message.id))
    }
    console.log(`> [google-gmail]:    Fetching messages data (${messagesData.length})`)
    return messagesData
  }

  async function fetchMessagesAttachmentsData(messagesData) {
    const messagesAttachmentsData = []
    for (let messageData of messagesData) {
      messagesAttachmentsData.push( extractParts(messageData) )
    }
    return messagesAttachmentsData
  }

  async function fetchAndDownloadAttachments(messagesAttachmentsData, destinationPath, gmailRule) {
    console.log(`> [google-gmail]:    Downloading attachments in (${path.resolve(destinationPath)}):`)
    for (let messageAttachmentData of messagesAttachmentsData) {
      for (let attachmentData of messageAttachmentData) {
        await downloadAttachment(attachmentData, destinationPath)
      }
      await updateMessageLabels(messageAttachmentData[0].messageId, gmailRule)
    }
  }

  async function listMessages(gmailRule) {
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: gmailRule.maxResults,
        q: `from:(${gmailRule.from}) has:attachment ` + gmailRule.query
        //pageToken: '',
      })
      if (!response.data.hasOwnProperty('messages')) {
        console.log(`> [google-gmail]:    No messages found with the rules`)
        return []
      }
      const data = response.data.messages.map((message) => {
        return message
      })
      console.log(`> [google-gmail]:    Fetching gmail messages list (${data.length})`)
      return data
    } catch(e) {
      throw e
    }
  }

  async function getMessage(messageId) {
      try {
        const response = await gmail.users.messages.get({
          userId: 'me',
          id: messageId
        })
        return response.data
      } catch(e) {
          throw e
      }
  }

  function extractParts(message) {
    const parts = []
    if (!message.payload.hasOwnProperty('parts'))
      return []
    for (let part of message.payload.parts) {
      if (part.mimeType == 'application/pdf') {
        parts.push({
          messageId: message.id,
          attachmentId: part.body.attachmentId,
          filename: part.filename,
          //size: part.body.size,
          //mimeType: part.mimeType
        })
      }
    }
    return parts
  }

  async function downloadAttachment(messageAttachmentData, destinationPath) {
    const fileName = `${messageAttachmentData.messageId}_${messageAttachmentData.filename}`
      try {
        const response = await gmail.users.messages.attachments.get({
          id: messageAttachmentData.attachmentId,
          messageId: messageAttachmentData.messageId,
          userId: 'me'
        })
        //response.data (base64url encoded string)
        const buff = Buffer.from(response.data.data, 'base64')
        const filePath = (destinationPath ? 
          path.resolve(destinationPath, fileName) : path.resolve(__dirname, `../tmp/${fileName}`))
        fs.writeFileSync(filePath, buff)
        //console.log(`      - Attachment(${fileName}) => ${filePath}`)
        console.log(`> [google-gmail]:      - Attachment(${fileName})`)
      } catch(e) {
        throw e
      }
  }

  async function updateMessageLabels(messageId, gmailRule) {
    const userLabels = await listLabels('user') //todo: persist data (concat with new created ones)
    //check if the labels to add in the message exist in current user gmail profile
    const labelsToCreate = gmailRule.addLabels.filter((ruleLabel) => {
      return userLabels.map(label => { return label['name'] }).indexOf(ruleLabel) === -1
    })
    for (let labelToCreate of labelsToCreate) {
      console.log(`> [google-gmail]: Creating new labels: [${labelToCreate}]`)
      await createLabel(labelToCreate)
    }
    console.log(`> [google-gmail]: Updating message (${messageId}) labels...`)
    await modifyMessageLabels(messageId, gmailRule)
  }

  async function modifyMessageLabels(messageId, gmailRule) {
    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          removeLabelIds: await getLabelsIds(gmailRule.removeLabels),
          addLabelIds: await getLabelsIds(gmailRule.addLabels)
        }
      })
      return response.data
    } catch(e) {
      throw e
    }
  }

  async function getLabelsIds(labelsNames) {
    const userLabels = await listLabels()
    const labelsIds = userLabels.filter((label) => {
      return labelsNames.indexOf(label.name) > -1
    }).map((label) => {
      return label.id
    })
    return labelsIds
  }

  async function listLabels(labelType) {
    try {
      const response = await gmail.users.labels.list({
        userId: 'me'
      })
      const labelsList = response.data.labels.filter((label) => {
        if (labelType)
          return label.type === labelType
        return true
      }).map((label) => {
        return {id: label.id, name: label.name}
      })
      return labelsList
    } catch(e) {
      throw e
    }
  }

  async function createLabel(labelName) {
    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        resource: {
          'name': labelName
        }
      })
      return {id: response.data.id, name: response.data.name}
    } catch(e) {
      throw e
    }
  }

}

module.exports = robot
