import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req) //lấy từng chỗ check lỗi lưu vào req
    //cái hàm run trả ra gì ? -> Promise thì dùng await
    //bỏ checkSchema vào validate, được middleware, nếu kh lỗi thì next
    //nế lỗi thì response ra 400

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })

    // xử lý errorObject, for các lỗi khác 422
    for (const key in errorObject) {
      // lấy msg của từng cái lỗi
      const { msg } = errorObject[key]
      // nếu msg có dạng ErrorWithStatus và status !== 422 thì ném cho default error handler

      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }

      //lưu các lỗi 422 từ errorObject vào entityError
      entityError.errors[key] = msg
    }
    //ở đây nó xử lý lỗi luôn chứ kh ném về error (default) handler tổng
    next(entityError)
  }
}
