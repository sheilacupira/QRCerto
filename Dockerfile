# Use uma imagem base leve do Node
FROM node:20-slim

# 1) Instala as bibliotecas nativas do OpenCV
RUN apt-get update && \
    apt-get install -y libopencv-dev build-essential pkg-config && \
    rm -rf /var/lib/apt/lists/*

# 2) Define o diretório de trabalho
WORKDIR /app

# 3) Copia package.json e package-lock.json para instalar as deps primeiro
COPY package*.json ./

# 4) Executa npm install (agora opencv4nodejs vai compilar contra as libs instaladas)
RUN npm install

# 5) Copia o restante do seu código
COPY . .

# 6) Expõe a porta usada pelo Express
EXPOSE 3000

# 7) Comando para iniciar sua API
CMD ["node", "index.js"]
