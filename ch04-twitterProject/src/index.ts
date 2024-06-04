import express, { Request, Response, NextFunction } from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { MongoClient } from 'mongodb'
import { config } from 'dotenv'
import { UPLOAD_DIR } from './constants/dir'
import staticRouter from './routes/static.routes'
config()

const app = express()
app.use(express.json())
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors')
const PORT = process.env.PORT || 4000
initFolder()

databaseService.connect()

app.use(cors())
// route localhost:3000
app.get('/', (req, res) => {
  res.send('Hello World !')
})

app.use('/users', usersRouter)
//localhost:3000/users/tweets
app.use('/medias', mediasRouter) //route handler
// app.use('/static', express.static(UPLOAD_DIR))
app.use('/static', staticRouter)

app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`server đang chạy trên port ${PORT}`)
})
