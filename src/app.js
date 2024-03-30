import express from 'express'
import line from '@line/bot-sdk'
import { Configuration, OpenAIApi } from 'openai'

const openAIConfiguration = new Configuration({
  apiKey: process.env.OPEN_AI_TOKEN,
})
const openai = new OpenAIApi(openAIConfiguration)


const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
}
const client = new line.Client(lineConfig)
const app = express()

app.post('/callback', line.middleware(lineConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err)
      res.status(500).end()
    })
})

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  const { data } = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: event.message.text,
      }
    ],
    max_tokens: 500
  })

  const [choices] = data.choices
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: choices.message.content.trim() || '🤖 ALFRED is at your service.'
  })
}

app.get('/', (req, res) => {
  res.send('🤵‍♂️ ALFRED is at your service.')
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`ALFRED listening on http://localhost:${port}/`)
})
