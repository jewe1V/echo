terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

provider "yandex" {
  cloud_id  = var.cloud_id
  folder_id = var.folder_id
  zone      = var.zone
}

# VPC

resource "yandex_vpc_network" "echo" {
  name = "echo-network"
}

resource "yandex_vpc_subnet" "echo" {
  name           = "echo-subnet"
  zone           = var.zone
  network_id     = yandex_vpc_network.echo.id
  v4_cidr_blocks = ["10.2.0.0/16"]
}

# Service Account + IAM

resource "yandex_iam_service_account" "echo" {
  name = "echo-sa"
}

resource "yandex_resourcemanager_folder_iam_member" "functions" {
  folder_id = var.folder_id
  role      = "serverless.functions.invoker"
  member    = "serviceAccount:${yandex_iam_service_account.echo.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "storage" {
  folder_id = var.folder_id
  role      = "storage.editor"
  member    = "serviceAccount:${yandex_iam_service_account.echo.id}"
}

# Object Storage

resource "yandex_storage_bucket" "images" {
  bucket = "echo-post-images"
  acl    = "public-read"

  anonymous_access_flags {
    read = true
    list = false
  }
}

resource "yandex_storage_bucket" "frontend" {
  bucket = "echo-frontend"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  anonymous_access_flags {
    read = true
    list = true
  }
}

# Functions config

locals {
  functions = {
    auth = {
      name       = "echo-auth"
      file       = "../backend/api/auth.py"
      entrypoint = "auth.handler"
    }
    get_posts = {
      name       = "echo-get-posts"
      file       = "../backend/api/get_posts.py"
      entrypoint = "get_posts.handler"
    }
    create_post = {
      name       = "echo-create-post"
      file       = "../backend/api/create_post.py"
      entrypoint = "create_post.handler"
    }
    edit_post = {
      name       = "echo-edit-post"
      file       = "../backend/api/edit_post.py"
      entrypoint = "edit_post.handler"
    }
    delete_post = {
      name       = "echo-delete-post"
      file       = "../backend/api/delete_post.py"
      entrypoint = "delete_post.handler"
    }
    like_post = {
      name       = "echo-like-post"
      file       = "../backend/api/like_post.py"
      entrypoint = "like_post.handler"
    }
    comment = {
      name       = "echo-create-comment"
      file       = "../backend/api/comment_post.py"
      entrypoint = "comment_post.handler"
    }
  }
}

# Archive functions

data "archive_file" "functions" {
  for_each    = locals.functions
  type        = "zip"
  source_file = each.value.file
  output_path = "build/${each.key}.zip"
}

# Serverless Functions

resource "yandex_function" "functions" {
  for_each = locals.functions
  name     = each.value.name
}

resource "yandex_function_version" "functions" {
  for_each = locals.functions

  function_id = yandex_function.functions[each.key].id
  runtime     = "python311"
  entrypoint  = each.value.entrypoint

  memory            = 128
  execution_timeout = 10

  service_account_id = yandex_iam_service_account.echo.id

  package {
    zip_filename = data.archive_file.functions[each.key].output_path
  }

  environment = {
    YDB_ENDPOINT    = var.ydb_endpoint
    YDB_REGION      = var.ydb_region
    JWT_SECRET      = var.jwt_secret
    S3_BUCKET_NAME  = yandex_storage_bucket.images.bucket
    S3_ENDPOINT_URL = "https://storage.yandexcloud.net"
    APP_ENV         = "production"
    CORS_ORIGINS    = var.cors_origins
  }
}

# API Gateway

resource "yandex_api_gateway" "echo" {
  name        = "echo-api-gateway"
  description = "Echo API"

  spec = templatefile("${path.module}/api-gateway.yaml", {
    sa_id = yandex_iam_service_account.echo.id

    auth_fn        = yandex_function.functions["auth"].id
    get_posts_fn   = yandex_function.functions["get_posts"].id
    create_post_fn = yandex_function.functions["create_post"].id
    edit_post_fn   = yandex_function.functions["edit_post"].id
    delete_post_fn = yandex_function.functions["delete_post"].id
    like_post_fn   = yandex_function.functions["like_post"].id
    comment_fn     = yandex_function.functions["comment"].id
  })
}

# Outputs

output "frontend_url" {
  value = "https://${yandex_storage_bucket.frontend.bucket}.website.yandexcloud.net"
}

output "images_bucket" {
  value = yandex_storage_bucket.images.bucket
}

output "api_gateway_id" {
  value = yandex_api_gateway.echo.id
}
