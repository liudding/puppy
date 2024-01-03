FROM node:16.20.0-slim

# RUN apt-get update
# RUN mv /etc/apt/sources.list /etc/apt/sources.list.bak && touch /etc/apt/sources.list
# RUN cat <<EOL >/etc/apt/sources.list
# deb http://mirrors.163.com/debian/ buster main non-free contrib
# deb http://mirrors.163.com/debian/ buster-updates main non-free contrib
# deb http://mirrors.163.com/debian/ buster-backports main non-free contrib
# deb http://mirrors.163.com/debian-security/ buster/updates main non-free contrib
# EOL

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg python3 \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-freefont-ttf libxss1 dbus dbus-x11 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# If running Docker >= 1.13.0 use docker run's --init arg to reap zombie processes, otherwise
# uncomment the following lines to have `dumb-init` as PID 1
# ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_x86_64 /usr/local/bin/dumb-init
# RUN chmod +x /usr/local/bin/dumb-init
# ENTRYPOINT ["dumb-init", "--"]

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-stable'})
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true



# Install puppeteer so it's available in the container.
# Add user so we don't need --no-sandbox.
# same layer as npm install to keep re-chowned files from using up several hundred MBs more space
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Set language to UTF8
ENV LANG="C.UTF-8"
ENV TZ="Asia/Shanghai"


# Run everything after as non-privileged user.
USER pptruser
WORKDIR /home/pptruser/app

RUN npm i puppeteer \
    && npm config set sharp_binary_host "https://npmmirror.com/mirrors/sharp" \
    && npm config set sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips" \
    && npm install sharp

COPY --chown=pptruser:pptruser . .

EXPOSE 3000

RUN cd src && yarn

CMD ["node", "src/index.js"]