"""Login do sistema.

Usuário e senha ficam na configuração (ADMIN_USUARIO / ADMIN_SENHA). Ao entrar, a API
devolve um token assinado com SECRET_KEY, que o frontend envia em toda chamada no
cabeçalho "Authorization: Bearer <token>". O token expira após TOKEN_HORAS.
"""

import base64
import hashlib
import hmac
import time

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["Login"])
bearer = HTTPBearer(auto_error=False)


class LoginEntrada(BaseModel):
    usuario: str
    senha: str


class LoginSaida(BaseModel):
    token: str
    usuario: str
    expira_em: int


def _assinar(dados: str) -> str:
    chave = get_settings().secret_key.encode()
    return hmac.new(chave, dados.encode(), hashlib.sha256).hexdigest()


def criar_token(usuario: str) -> tuple[str, int]:
    expira_em = int(time.time()) + get_settings().token_horas * 3600
    dados = f"{usuario}|{expira_em}"
    token = base64.urlsafe_b64encode(f"{dados}|{_assinar(dados)}".encode()).decode()
    return token, expira_em


def validar_token(token: str) -> str | None:
    """Devolve o usuário do token, ou None se ele for inválido ou estiver expirado."""
    try:
        usuario, expira_em, assinatura = base64.urlsafe_b64decode(token).decode().rsplit("|", 2)
        if not hmac.compare_digest(assinatura, _assinar(f"{usuario}|{expira_em}")):
            return None
        if int(expira_em) < time.time():
            return None
        return usuario
    except (ValueError, UnicodeDecodeError):
        return None


def exigir_login(credenciais: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    usuario = validar_token(credenciais.credentials) if credenciais else None
    if usuario is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Sessão expirada. Faça login novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return usuario


@router.post("/login", response_model=LoginSaida)
def login(dados: LoginEntrada):
    settings = get_settings()
    usuario_ok = hmac.compare_digest(dados.usuario.strip(), settings.admin_usuario)
    senha_ok = hmac.compare_digest(dados.senha, settings.admin_senha)
    if not (usuario_ok and senha_ok):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário ou senha incorretos.")
    token, expira_em = criar_token(settings.admin_usuario)
    return LoginSaida(token=token, usuario=settings.admin_usuario, expira_em=expira_em)


@router.get("/eu")
def usuario_atual(usuario: str = Depends(exigir_login)):
    """Confirma se o token ainda é válido."""
    return {"usuario": usuario}
