FROM anogram-frontend AS static

FROM nginx:alpine
COPY --from=static /usr/share/nginx/html /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
