# ----------------------------------------------------------
# Makefile boilerplate: Begin
# ----------------------------------------------------------

_EM_OK   = ✅
_EM_ERR  = ❌
_EM_WARN = ⚠️
_EM_CMD  = 🔹

_C_CYAN  = $(shell tput setaf 6)
_C_OFF   = $(shell tput sgr0)
_L_CONTAINER = 📦

# ----------------------------------------------------------
# Show help information for all targets in a Makefile
# It is best to have this as the default target
# ----------------------------------------------------------
.PHONY: help
help: ## ❓ Display help information for Makefile targets
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9._-]+:.*?## / {printf "  $(_C_CYAN)%-30s$(_C_OFF) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ----------------------------------------------------------
# Other variables
# ----------------------------------------------------------

# Short Git hash (with + suffix if there are uncommitted changes)
GIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
ifneq ($(shell git status --porcelain 2>/dev/null),)
	GIT_HASH := $(GIT_HASH)+
endif

# Current build date in RFC3339 format
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# ----------------------------------------------------------
# Precautions
# ----------------------------------------------------------

RM ?= rm -f

# ----------------------------------------------------------
# Makefile boilerplate: End
# ----------------------------------------------------------
