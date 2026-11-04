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

variable "groq_api_key" {
  description = "Groq API Key para el Asistente Virtual"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_host" {
  description = "Host de la base de datos PostgreSQL"
  type        = string
  default     = "localhost"
}

variable "db_port" {
  description = "Puerto de la base de datos PostgreSQL"
  type        = number
  default     = 5432
}

variable "db_user" {
  description = "Usuario de la base de datos PostgreSQL"
  type        = string
  default     = "postgres"
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "dewatering_solutions"
}

variable "db_password" {
  description = "Password de la base de datos PostgreSQL"
  type        = string
  sensitive   = true
  default     = "Dewatering@2026"
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


  egress {
    description = "Salida libre a Internet (PostgreSQL + IA API + Docker Hub)"
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

# 3. Llave SSH para acceso al servidor
resource "aws_key_pair" "deployer" {
  key_name   = "dewatering-deployer-key"
  public_key = file("${path.module}/id_rsa_aws.pub")
}

# 4. Instancia EC2 con aprovisionamiento automático de Docker y el repositorio
resource "aws_instance" "dewatering_server" {
  ami                         = data.aws_ami.ubuntu_24_04.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.deployer.key_name
  vpc_security_group_ids      = [aws_security_group.dewatering_sg.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              exec > /var/log/user-data.log 2>&1

              echo "=== INICIANDO INSTALACIÓN DEWATERING SOLUTIONS ==="
              export DEBIAN_FRONTEND=noninteractive

              # 1. Actualizar e instalar dependencias oficiales de Ubuntu 24.04 LTS
              apt-get update -y
              apt-get install -y docker.io docker-compose-v2 git curl

              # 2. Configurar servicio Docker
              systemctl enable --now docker
              usermod -aG docker ubuntu

              # 3. Clonar repositorio del proyecto
              cd /home/ubuntu
              git clone ${var.repo_url} dewatering-platform
              cd /home/ubuntu/dewatering-platform

              # 4. Crear archivo .env de producción para el Backend
              cat << ENVEOF > backend/.env
DB_HOST=${var.db_host}
DB_PORT=${var.db_port}
DB_USER=${var.db_user}
DB_PASSWORD=${var.db_password}
DB_NAME=${var.db_name}
JWT_SECRET=dewatering_solutions_jwt_secret_2026_super_secure
PORT=3000
NODE_ENV=production
GROQ_API_KEY=${var.groq_api_key}
GROQ_MODEL=openai/gpt-oss-120b
ENVEOF

              chown -R ubuntu:ubuntu /home/ubuntu/dewatering-platform

              # 5. Levantar contenedores Docker (Frontend Nginx + Backend Express)
              docker compose -f docker/docker-compose.yml up -d --build

              echo "=== DEWATERING SOLUTIONS DESPLEGADO CON ÉXITO ==="
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

output "ssh_command" {
  description = "Comando para conectarse por SSH al servidor EC2"
  value       = "ssh -i id_rsa_aws ubuntu@${aws_instance.dewatering_server.public_ip}"
}

