#!/bin/bash
# start.sh - Entrypoint para MariaDB DriveCloud

/usr/local/bin/docker-entrypoint.sh mariadbd &

echo "Esperando a que MariaDB responda..."
until mariadb-admin ping -h localhost --silent; do
    sleep 2
done

echo "MariaDB listo."
wait
