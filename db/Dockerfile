FROM postgres:17-bookworm
COPY --chmod=755 db/start-postgres.sh /usr/local/bin/start-postgres
ENTRYPOINT ["/usr/local/bin/start-postgres"]
CMD ["postgres"]
