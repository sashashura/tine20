# description:
#   The base image should contain everything that is needed for tine20. But dose not depend on the tine20 repo.
#
# build:
#   $ docker build [...] .
#
# ARGS:
#   TINE20ROOT=/usr/share
#   ALPINE_PHP_PACKAGE=php7 php package prefix

#  -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -
ARG ALPINE_BRANCH=3.14

FROM alpine:${ALPINE_BRANCH} as cache-invalidator
ARG ALPINE_PHP_PACKAGE=php7
ARG CACHE_BUST=0

RUN apk add --update --no-cache --simulate supervisor curl bash ytnef openjdk8-jre gettext openssl netcat-openbsd | sha256sum >> /cachehash
RUN apk add --no-cache --simulate \
                                  ${ALPINE_PHP_PACKAGE} \
                                  ${ALPINE_PHP_PACKAGE}-bcmath \
                                  ${ALPINE_PHP_PACKAGE}-ctype \
                                  ${ALPINE_PHP_PACKAGE}-curl \
                                  ${ALPINE_PHP_PACKAGE}-exif \
                                  ${ALPINE_PHP_PACKAGE}-fileinfo \
                                  ${ALPINE_PHP_PACKAGE}-fpm \
                                  ${ALPINE_PHP_PACKAGE}-gd \
                                  ${ALPINE_PHP_PACKAGE}-gettext \
                                  ${ALPINE_PHP_PACKAGE}-iconv \
                                  ${ALPINE_PHP_PACKAGE}-intl \
                                  ${ALPINE_PHP_PACKAGE}-json \
                                  ${ALPINE_PHP_PACKAGE}-ldap \
                                  ${ALPINE_PHP_PACKAGE}-mysqli \
                                  ${ALPINE_PHP_PACKAGE}-opcache \
                                  ${ALPINE_PHP_PACKAGE}-pcntl \
                                  ${ALPINE_PHP_PACKAGE}-pdo_mysql \
                                  ${ALPINE_PHP_PACKAGE}-pecl-igbinary \
                                  ${ALPINE_PHP_PACKAGE}-pecl-redis \
                                  ${ALPINE_PHP_PACKAGE}-pecl-yaml \
                                  ${ALPINE_PHP_PACKAGE}-phar \
                                  ${ALPINE_PHP_PACKAGE}-posix \
                                  ${ALPINE_PHP_PACKAGE}-simplexml \
                                  ${ALPINE_PHP_PACKAGE}-soap \
                                  ${ALPINE_PHP_PACKAGE}-sockets \
                                  ${ALPINE_PHP_PACKAGE}-sodium \
                                  ${ALPINE_PHP_PACKAGE}-tokenizer \
                                  ${ALPINE_PHP_PACKAGE}-xml \
                                  ${ALPINE_PHP_PACKAGE}-xmlreader \
                                  ${ALPINE_PHP_PACKAGE}-xmlwriter \
                                  ${ALPINE_PHP_PACKAGE}-xsl \
                                  ${ALPINE_PHP_PACKAGE}-zip \
                                  | sha256sum >> /cachehash
RUN apk add --no-cache --simulate --repository http://dl-cdn.alpinelinux.org/alpine/v3.13/community/ gnu-libiconv=1.15-r3 \
                                  | sha256sum >> /cachehash
RUN apk add --no-cache --simulate --repository http://dl-cdn.alpinelinux.org/alpine/edge/main nginx nginx-mod-http-brotli \
                                  | sha256sum >> /cachehash

#  -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -    -
FROM alpine:${ALPINE_BRANCH} as base
ARG ALPINE_PHP_PACKAGE=php7
ARG TINE20ROOT=/usr/share

#todo version vars | move tika to lib
RUN wget -O /usr/sbin/confd https://github.com/kelseyhightower/confd/releases/download/v0.16.0/confd-0.16.0-linux-amd64 \
    && chmod +x /usr/sbin/confd
RUN wget -O /usr/local/bin/tika.jar http://packages.tine20.org/tika/tika-app-1.14.jar

# todo check if copy or add craetes folder
RUN mkdir /usr/local/lib/container

COPY --from=cache-invalidator /cachehash /usr/local/lib/container/

RUN apk add --update --no-cache supervisor curl bash ytnef openjdk8-jre gettext openssl netcat-openbsd
RUN apk add --no-cache \
                                  ${ALPINE_PHP_PACKAGE} \
                                  ${ALPINE_PHP_PACKAGE}-bcmath \
                                  ${ALPINE_PHP_PACKAGE}-ctype \
                                  ${ALPINE_PHP_PACKAGE}-curl \
                                  ${ALPINE_PHP_PACKAGE}-exif \
                                  ${ALPINE_PHP_PACKAGE}-fileinfo \
                                  ${ALPINE_PHP_PACKAGE}-fpm \
                                  ${ALPINE_PHP_PACKAGE}-gd \
                                  ${ALPINE_PHP_PACKAGE}-gettext \
                                  ${ALPINE_PHP_PACKAGE}-iconv \
                                  ${ALPINE_PHP_PACKAGE}-intl \
                                  ${ALPINE_PHP_PACKAGE}-json \
                                  ${ALPINE_PHP_PACKAGE}-ldap \
                                  ${ALPINE_PHP_PACKAGE}-mysqli \
                                  ${ALPINE_PHP_PACKAGE}-opcache \
                                  ${ALPINE_PHP_PACKAGE}-pcntl \
                                  ${ALPINE_PHP_PACKAGE}-pdo_mysql \
                                  ${ALPINE_PHP_PACKAGE}-pecl-igbinary \
                                  ${ALPINE_PHP_PACKAGE}-pecl-redis \
                                  ${ALPINE_PHP_PACKAGE}-pecl-yaml \
                                  ${ALPINE_PHP_PACKAGE}-phar \
                                  ${ALPINE_PHP_PACKAGE}-posix \
                                  ${ALPINE_PHP_PACKAGE}-simplexml \
                                  ${ALPINE_PHP_PACKAGE}-soap \
                                  ${ALPINE_PHP_PACKAGE}-sockets \
                                  ${ALPINE_PHP_PACKAGE}-sodium \
                                  ${ALPINE_PHP_PACKAGE}-tokenizer \
                                  ${ALPINE_PHP_PACKAGE}-xml \
                                  ${ALPINE_PHP_PACKAGE}-xmlreader \
                                  ${ALPINE_PHP_PACKAGE}-xmlwriter \
                                  ${ALPINE_PHP_PACKAGE}-xsl \
                                  ${ALPINE_PHP_PACKAGE}-zip

RUN apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/main nginx nginx-mod-http-brotli
# fix alpine iconv problem e.g. could not locate filter
RUN apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/v3.13/community/ gnu-libiconv=1.15-r3
ENV LD_PRELOAD /usr/lib/preloadable_libiconv.so php

RUN if [ ! -f /usr/bin/php ] && [ -f /usr/bin/php8 ]; then ln -s /usr/bin/php8 /usr/bin/php; echo "php8 symlink created"; fi
RUN if [ ! -f /usr/sbin/php-fpm ] && [ -f /usr/sbin/php-fpm8 ]; then ln -s /usr/sbin/php-fpm8 /usr/sbin/php-fpm; echo "php-fpm8 symlink created"; fi
RUN if [ ! -f /usr/sbin/php-fpm ] && [ -f /usr/sbin/php-fpm7 ]; then ln -s /usr/sbin/php-fpm7 /usr/sbin/php-fpm; echo "php-fpm7 symlink created"; fi
RUN if [ ! -d /etc/php ] && [ -d /etc/php8 ]; then ln -s /etc/php8 /etc/php; echo "etc php8 symlink created"; fi
RUN if [ ! -d /etc/php ] && [ -d /etc/php7 ]; then ln -s /etc/php7 /etc/php; echo "etc php7 symlink created"; fi

RUN addgroup -S -g 150 tine20 && \
    adduser -S -H -D -s /bin/ash -g "tine20 user" -G tine20 -u 150 tine20 && \
    mkdir -p /etc/tine20/conf.d && \
    mkdir -p /etc/confd && \
    mkdir -p /etc/supervisor.d && \
    mkdir -p /var/log/tine20 && \
    mkdir -p /var/lib/tine20/files && \
    mkdir -p /var/lib/tine20/tmp && \
    mkdir -p /var/lib/tine20/caching && \
    mkdir -p /var/lib/tine20/sessions && \
    mkdir -p /var/run/tine20 && \
    mkdir -p /run/nginx && \
    mkdir -p /etc/php7/php-fpm.d/ && \
    mkdir -p /etc/php8/php-fpm.d/ && \
    rm -r /etc/nginx/http.d && \
    rm /etc/nginx/nginx.conf && \
    mkdir -p /etc/nginx/conf.d/ && \
    mkdir -p /etc/nginx/http.d/ && \
    mkdir -p /etc/nginx/snippets/ && \
    mkdir -p ${TINE20ROOT}/tine20 && \
    touch /var/log/tine20/tine20.log && \
    chown tine20:tine20 /var/log/tine20 && \
    chown tine20:tine20 /var/lib/tine20/files && \
    chown tine20:tine20 /var/lib/tine20/caching && \
    chown tine20:tine20 /var/lib/tine20/sessions && \
    chown tine20:tine20 /var/lib/tine20/tmp && \
    chown tine20:tine20 /var/lib/nginx && \
    chown tine20:tine20 /var/lib/nginx/tmp && \
    chown tine20:tine20 /var/log/tine20/tine20.log

COPY ci/dockerimage/confd/conf.d /etc/confd/conf.d
COPY ci/dockerimage/confd/templates/ /etc/confd/templates
COPY etc/tine20/config.inc.php.tmpl /etc/confd/templates/config.inc.php.tmpl
COPY etc/tine20/conf.d/logger.inc.php.tmpl /etc/confd/templates/logger.inc.php.tmpl
COPY etc/tine20/conf.d/worker.inc.php.tmpl /etc/confd/templates/worker.inc.php.tmpl
COPY etc/nginx/sites-available/tine20.conf.tmpl /etc/confd/templates/nginx-vhost.conf.tmpl
COPY etc/tine20/conf.d/*.inc.php.dist /etc/tine20/conf.d
COPY etc/tine20/conf.d/*.inc.php /etc/tine20/conf.d
COPY etc/tine20/actionQueue.ini /etc/tine20/actionQueue.ini
COPY etc/nginx/conf.d/ /etc/nginx/conf.d
COPY etc/nginx/snippets /etc/nginx/snippets
COPY ci/dockerimage/supervisor.d/conf.ini /etc/supervisor.d/
COPY ci/dockerimage/supervisor.d/nginx.ini /etc/supervisor.d/
COPY ci/dockerimage/supervisor.d/crond.ini /etc/supervisor.d/
COPY ci/dockerimage/supervisor.d/php-fpm.ini /etc/supervisor.d/
COPY ci/dockerimage/scripts/* /usr/local/bin/

WORKDIR ${TINE20ROOT}
ENV TINE20ROOT=${TINE20ROOT}
CMD ["/usr/local/bin/entrypoint"]
