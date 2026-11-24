#!/usr/bin/env python3
"""
Sobe o projeto HADI completo com um único comando:

    python rodar.py

- Backend (Spring Boot) em http://localhost:8080  (pasta backend/, via Maven)
- Site (front estático)  em http://localhost:8090  (pasta raiz)
- Abre o navegador quando os dois estiverem no ar.
- Ctrl+C encerra os dois.

Pré-requisitos: Python 3, Java 17+ e Maven (mvn) no PATH.
"""
import functools
import http.server
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import webbrowser

RAIZ = os.path.dirname(os.path.abspath(__file__))
PASTA_BACKEND = os.path.join(RAIZ, "backend")
PORTA_BACKEND = 8080
PORTA_SITE = 8090
WINDOWS = os.name == "nt"


def porta_em_uso(porta):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", porta)) == 0


def comando_maven():
    for nome in (["mvnw.cmd", "mvn.cmd", "mvn"] if WINDOWS else ["mvnw", "mvn"]):
        local = os.path.join(PASTA_BACKEND, nome)
        if os.path.isfile(local):
            return [local]
        caminho = shutil.which(nome)
        if caminho:
            return [caminho]
    return None


def iniciar_backend():
    if porta_em_uso(PORTA_BACKEND):
        print(f"[backend] Porta {PORTA_BACKEND} já está em uso — usando o backend que já está rodando.")
        return None
    mvn = comando_maven()
    if not mvn:
        sys.exit("[erro] Maven não encontrado. Instale o Maven (mvn) e o Java 17+ e tente de novo.")
    if not shutil.which("java"):
        sys.exit("[erro] Java não encontrado. Instale o Java 17+ e tente de novo.")

    print(f"[backend] Iniciando Spring Boot em http://localhost:{PORTA_BACKEND} (a primeira vez demora: o Maven baixa as dependências)...")
    extra = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if WINDOWS else {"start_new_session": True}
    return subprocess.Popen(mvn + ["-q", "spring-boot:run"], cwd=PASTA_BACKEND, **extra)


def iniciar_site():
    if porta_em_uso(PORTA_SITE):
        sys.exit(f"[erro] Porta {PORTA_SITE} já está em uso. Feche o outro servidor e tente de novo.")

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):  # silencia o log de cada arquivo servido
            pass

        def end_headers(self):  # evita o navegador ficar com JS/CSS antigos em cache
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", PORTA_SITE), functools.partial(Handler, directory=RAIZ))
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    print(f"[site]    Servindo o front em http://localhost:{PORTA_SITE}")
    return servidor


def parar_backend(proc):
    if not proc or proc.poll() is not None:
        return
    print("[backend] Encerrando...")
    try:
        if WINDOWS:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        else:
            os.killpg(proc.pid, signal.SIGTERM)
        proc.wait(timeout=15)
    except Exception:
        proc.kill()


def main():
    backend = iniciar_backend()
    site = None
    try:
        site = iniciar_site()

        # Espera o backend responder (até 3 minutos, por causa do download do Maven na 1ª vez)
        limite = time.time() + 180
        while not porta_em_uso(PORTA_BACKEND):
            if backend and backend.poll() is not None:
                sys.exit("[erro] O backend parou ao iniciar. Veja as mensagens do Maven acima.")
            if time.time() > limite:
                sys.exit("[erro] O backend demorou demais para subir.")
            time.sleep(1)
        print(f"[backend] No ar em http://localhost:{PORTA_BACKEND}/api/produtos")

        url = f"http://localhost:{PORTA_SITE}/index.html"
        print(f"\nPronto! Abra {url}\nPressione Ctrl+C para encerrar.\n")
        webbrowser.open(url)

        while backend is None or backend.poll() is None:
            time.sleep(1)
        print("[backend] O backend foi encerrado.")
    except KeyboardInterrupt:
        print()
    finally:
        if site:
            site.shutdown()
        parar_backend(backend)
        print("Tudo encerrado.")


if __name__ == "__main__":
    main()
