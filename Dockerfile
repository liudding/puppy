FROM ubuntu:20.04

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=Asia/Shanghai
ENV LANG=C.UTF-8

ARG PUPPY_USER_ID=999
ARG APP_DIR=/usr/src/app
ARG NODE_VERSION=v20.12.0

ENV NODE_VERSION=$NODE_VERSION
ENV NVM_DIR /usr/src/.nvm
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV PATH $NODE_PATH:$PATH
ENV APP_DIR=$APP_DIR
ENV TZ=$TZ
ENV DEBIAN_FRONTEND=$DEBIAN_FRONTEND
ENV HOST=0.0.0.0
ENV PORT=3000
ENV LANG="C.UTF-8"
ENV NODE_ENV=production
ENV DEBUG_COLORS=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/local/bin/playwright-browsers

RUN mkdir -p $APP_DIR $NVM_DIR



RUN apt-get update && apt-get install -y \
  ca-certificates \
  curl \
  dumb-init \
  git \
  gnupg \
  libu2f-udev \
  software-properties-common \
  ssh \
  wget \
  xvfb

RUN curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash &&\
  . $NVM_DIR/nvm.sh &&\
  nvm install $NODE_VERSION

RUN add-apt-repository universe && apt-get update && \
  apt-get install -y python3.10 python3-pip && \
  update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1 && \
  update-alternatives --install /usr/bin/python python /usr/bin/python3 1

RUN groupadd -r puppyuser && useradd --uid ${PUPPY_USER_ID} -r -g puppyuser -G audio,video puppyuser && \
  mkdir -p /home/puppyuser/Downloads && \
  chown -R puppyuser:puppyuser /home/puppyuser



RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
  apt-get -y -qq install software-properties-common &&\
  apt-add-repository "deb http://archive.canonical.com/ubuntu $(lsb_release -sc) partner" && \
  apt-get -y -qq --no-install-recommends install \
    fontconfig \
    fonts-freefont-ttf \
    fonts-gfs-neohellenic \
    fonts-ubuntu \
    fonts-wqy-zenhei

WORKDIR $APP_DIR

COPY --chown=pptruser:pptruser ./src .

RUN npx --yes playwright install chromium &&\
  npx --yes playwright install-deps chromium &&\
  chown -R puppyuser:puppyuser $APP_DIR &&\
  fc-cache -f -v && \
  apt-get -qq clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/fonts/truetype/noto

RUN npm config set sharp_binary_host "https://npmmirror.com/mirrors/sharp" \
    && npm config set sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips" \
    && npm install

USER puppyuser


EXPOSE 3000

CMD ["node", "index.js"]