# ============================================================================
# Dewatering Solutions Platform — Infraestructura como Código (Terraform AWS)
# Despliega automáticamente EC2 Ubuntu 24.04 + Security Group + Docker Compose
# ============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "Región de AWS para desplegar Dewatering Solutions"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "Tamaño de la instancia EC2 (t3.small o t3.medium recomendado para Docker build)"
  type        = string
  default     = "t3.small"
}

variable "repo_url" {
  description = "Repositorio GitHub del proyecto"
  type        = string
  default     = "https://github.com/0xhazroot/dewatering-solutions.git"
}

# 1. Buscar automáticamente la última imagen oficial de Ubuntu 24.04 LTS en AWS
data "aws_ami" "ubuntu_24_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 2. Firewall (Security Group) abriendo puertos Web (80, 443, 8080), API (3000) y SSH (22)
resource "aws_security_group" "dewatering_sg" {
  name        = "dewatering-solutions-sg"
  description = "Security Group para Dewatering Solutions Platform (Frontend Nginx + Backend Express)"

  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Web Traffic (Nginx Reverse Proxy)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Web Traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Puerto alternativo Frontend (8080)"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Puerto directo API Healthcheck (3000)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Salida libre a Internet (Supabase PostgreSQL + IA API + Docker Hub)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "dewatering-solutions-sg"
    Project = "DewateringSolutions"
  }
}

# 3. Instancia EC2 con aprovisionamiento automático de Docker y el repositorio
resource "aws_instance" "dewatering_server" {
  ami                         = data.aws_ami.ubuntu_24_04.id
  instance_type               = var.instance_type
  vpc_security_group_ids      = [aws_security_group.dewatering_sg.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              apt-get update -y
              apt-get install -y ca-certificates curl git
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
              chmod a+r /etc/apt/keyrings/docker.asc
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              usermod -aG docker ubuntu
              systemctl enable docker
              systemctl start docker

              cd /home/ubuntu
              git clone ${var.repo_url} dewatering-platform
              chown -R ubuntu:ubuntu /home/ubuntu/dewatering-platform
              EOF

  tags = {
    Name    = "dewatering-platform-prod"
    Project = "DewateringSolutions"
  }
}

output "public_ip" {
  description = "IP Pública del servidor AWS EC2"
  value       = aws_instance.dewatering_server.public_ip
}

output "application_url" {
  description = "URL principal de la plataforma en AWS"
  value       = "http://${aws_instance.dewatering_server.public_ip}"
}

output "api_health_url" {
  description = "URL de verificación de salud de la API"
  value       = "http://${aws_instance.dewatering_server.public_ip}/api/health"
}

