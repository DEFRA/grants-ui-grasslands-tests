FROM mcr.microsoft.com/playwright:v1.59.1-noble

ENV TZ="Europe/London"

USER root

RUN apt-get update -qq \
    && apt-get install -qqy \
    curl \
    zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws/

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
ENTRYPOINT [ "./entrypoint.sh" ]

CMD ["npm", "test"]

# This image downloads the linux amd64 AWS CLI. For M1 Macs build and run with the --platform=linux/amd64 argument.
