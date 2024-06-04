import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyTokenController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oAuthController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.reqests'
import { wrapAsync } from '~/utils/handlers'

const usersRouter = Router()

//controller
/*
des: đăng nhập
path: /users/login
method: POST
body: {email, password}
*/
usersRouter.post('/login', loginValidator, wrapAsync(loginController))

/**
 * Description: Register new user
 * Path: /register
 * Method: POST
 * body: {
 *      name: string
 *      email: string
 *      password: string
 *      confirm_password: string
 *      date_of_birth: string theo chuẩn ISO 8601
 * }
 */
usersRouter.post('/register', registerValidator, wrapAsync(registerController))

/**
 * des: lougout
 * path: /users/logout
 * method: POST
 * Header: {Authorization: 'Bearer <access_token>'}
 * body: {refresh_token: string}
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/**
 * des: verify email token
 * khi người dùng đăng ký họ sẽ nhận được mail có link dạng
 * http://localhost:3000/users/verify-email?token=<email_verify_token>
 * nếu mà em nhấp vào link thì sẽ tạo ra req gửi lên email_verify_token lên server
 * server kiểm tra email_verify_token có hợp lệ hay không ?
 * thì từ decoded_email_verify_token lấy ra user_id
 * và vào user_id đó để update email_verify_token thành '', verify = 1, update_at
 * path: /users/verify-email
 * method: POST
 * body: {email_verify_token: string}
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyTokenController))

/**
 * des: resend email verify email token
 * khi mail thất lạc, hoặc email_verify_token hết hạn,
 * thì người dùng có nhu cầu resend email_verify_token
 * method: post
 * path: /users/resend-verify-email
 * headers: {Authorization: "Bearer <access_token>"} //đăng nhập mới đc resend
 * body: {}
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/**
 * des: khi người dùng quên mật khẩu, họ gửi email để xin mình tạo cho họ forgot_password_token
 * path: /users/forgot-password
 * method: POST
 * body: {email: string}
 */
usersRouter.post('/forgot-passwrod', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/**
 * des: khi người dùng nhấp vào link trong email để reset password
 * họ sẽ gửi 1 req kèm theo forgot_password_token lên server
 * server sẽ kiểm tra forgot_password_token có hợp lệ hay không ?
 * sau đó chuyển hướng người dùng đến trang reset password
 * path: /users/verify-forgot-password
 * method: POST
 * body: {forgot_password_token: string}
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)

/**
 * des: reset password
 * path: '/reset-password'
 * method: POST
 * Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
 * body: {forgot_password_token: string, password: string, confirm_password: string}
 */
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPasswordController)
)

/**
 * des: get profile của user
 * path: '/me'
 * method: get
 * Header: {Authorization: Bearer <access_token>}
 * body: {}
 */
usersRouter.get('/me', accessTokenValidator, wrapAsync(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
)

/**
 * des: get profile của user khác bằng unsername
 * path: '/:username'
 * method: get
 * không cần header vì, chưa đăng nhập cũng có thể xem
 *
 *
 */
usersRouter.get('/:username', wrapAsync(getProfileController))
//chưa có controller getProfileController, nên bây giờ ta làm

/*
des: Follow someone
path: '/follow'
method: post
headers: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
*/
usersRouter.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, wrapAsync(followController))
//accessTokenValidator dùng dể kiểm tra xem ngta có đăng nhập hay chưa, và có đc user_id của người dùng từ req.decoded_authorization
//verifiedUserValidator dùng để kiễm tra xem ngta đã verify email hay chưa, rồi thì mới cho follow người khác
//trong req.body có followed_user_id  là mã của người mà ngta muốn follow
//followValidator: kiểm tra followed_user_id truyền lên có đúng định dạng objectId hay không
//  account đó có tồn tại hay không
//followController: tiến hành thao tác tạo document vào collection followers
/*
user 50 654d1871832bfe3381763dba
user 54 654d18fd37b1c7c2936bcf75
*/

/**
 * des: Unfollow someone
 * path: '/unfollow/:user_id'
 * method: delete
 * headers: {Authorization: Bearer <access_token>}
 */
usersRouter.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unfollowController)
)

/**
 * des: change password
 * path: '/change-password'
 * method: put
 * headers: {Authorization: Bearer <access_token>}
 * Body: {old_password: string, new_password: string, confirm_new_password: string}
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
)
//changePasswordValidator kiểm tra các giá trị truyền lên trên body cớ valid k ?

/**
 * des: refreshtoken
 * path: '/refresh-token'
 * method: POST
 * Body: {refresh_token: string}
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController))
//khỏi kiểm tra accesstoken, tại nó hết hạn rồi mà
//refreshController chưa làm

usersRouter.get('/oauth/google', wrapAsync(oAuthController))

export default usersRouter
