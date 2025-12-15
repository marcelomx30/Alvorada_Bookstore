#!/bin/bash
export $(cat .env.local | xargs)
go run main.go
