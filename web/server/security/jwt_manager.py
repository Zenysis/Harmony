from datetime import datetime, timedelta
from typing import Any, Dict

import jwt

from web.server.errors.errors import JWTTokenError

# pylint:disable=line-too-long
INVALID_TOKEN_MSG = 'Authorization failed due to an Invalid token.'
EXPIRED_TOKEN_MSG = 'Token expired. generate a new token'
SIGNATURE_ERROR = 'Cannot verify the signature of the token provided as it was signed by a non matching private key'
SERVER_ERROR_MESSAGE = 'Authorization failed. Please contact support.'
INVALID_ISSUER = 'Cannot verify the issuer of the token provided'

EXCEPTION_MAPPER = {
    ValueError: (SERVER_ERROR_MESSAGE, 500),
    TypeError: (SERVER_ERROR_MESSAGE, 500),
    jwt.ExpiredSignatureError: (EXPIRED_TOKEN_MSG, 401),
    jwt.DecodeError: (INVALID_TOKEN_MSG, 401),
    jwt.InvalidSignatureError: (SIGNATURE_ERROR, 500),
    jwt.InvalidIssuerError: (INVALID_ISSUER, 401),
}


class JWTManager:
    ''' JWT manager generates and decodes JWT token to use for authorization'''

    def __init__(self, issuer, secret_key, token_expiration) -> None:
        self.secret_key = secret_key
        self.issuer = issuer
        self.token_expiration = token_expiration

    def decode_token(self, token) -> Dict[str, Any]:
        '''Decode token
        Args:
            token (string): authorization token
         '''

        try:
            # verify that the token was signed using our secret key add decode it
            return jwt.decode(
                token,
                self.secret_key,
                algorithms=['HS256'],
                issuer=self.issuer,
                options={'verify_signature': True},
            )
        except (
            ValueError,
            TypeError,
            jwt.ExpiredSignatureError,
            jwt.DecodeError,
            jwt.InvalidSignatureError,
            jwt.InvalidIssuerError,
        ) as error:
            message, status_code = EXCEPTION_MAPPER.get(
                type(error), (SERVER_ERROR_MESSAGE, 500)
            )
            raise JWTTokenError(message, status_code) from error
        except Exception as e:
            raise JWTTokenError(e.__str__(), status_code=500) from e

    def generate_token(self, data: Dict[str, Any], expiration=None) -> str:
        ''' Encode data into JWT, pass the expiration time in second
        to override the JWT manager expiration time
        Args:
            data (dict): Payload to encode
            exp (int): Expires in seconds
        '''
        exp: int = expiration if expiration else self.token_expiration
        # datetime is converted into an UNIX UTC timestamp (an int)
        data.update(
            {
                'iss': self.issuer,
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(seconds=exp),
            }
        )
        # HS256 is prefered to allow use of the app's secret key as compared to other alternatives
        # that would require generating  public/private key pair to sign and verify tokens
        encoded: bytes = jwt.encode(data, self.secret_key, algorithm='HS256')
        return encoded.decode('utf-8')
