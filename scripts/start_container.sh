#Startup the docker in AWS EC2 GCS Server Production & Staging
#!/bin/sh
cd /home/ec2-user/gp-server/
sudo docker-compose up --build -d
sudo docker system prune -f