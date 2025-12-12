.PHONY: help
help: ## Show this help message
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: setup
setup: ## Set up the development environment
	bun install

.PHONY: format
format:  ## consistent formatting of JS, HTML and CSS files
	bun run format:check

.PHONY: check
check: ## Run all static checks
	bun run lint

.PHONY: test
test: ## Run all test (aka dynamic checks)
	bun test

.PHONY: images
images: ## Build extension's images
	./images/prepare-icons.sh

.PHONY: build
build: images ## Build extension's images and code
	bun run build

.PHONY: package
package: build ## Package the extension as a ZIP file for store submission
	bun run package
	cp -p dist/chrome/tab-a-mole-1.0.zip .

.PHONY: update
update: ## Update dependencies
	bun update --latest --no-progress --dry-run

.PHONY: all
all: prepare build

# ----------------------------------------------------------
# Image Processing Commands
# ----------------------------------------------------------

cleanup_images: ## cleanup processed images
	$(MAKE) -C images clean

.PHONY: images cleanup_images

# ----------------------------------------------------------
# Development and Build Commands
# ----------------------------------------------------------

prepare: format check

lint:  ## review code for Javascript issues
	bun run lint

dev: images  ## starts a development server with hot reloading
	bun run dev

preview: images  ## previews the extension in production without building
	bun run preview



cleanup_code: ## cleanup development environment
	bunx extension cleanup
	#-find . -name dist -not -path '*/node_modules/*' -delete -print
	-rm -r ./dist

.PHONY: prepare lint format dev preview build package cleanup_code

show: build
	@tree -sat dist/chrome

.PHONY: show

# ----------------------------------------------------------
# Cleanup Commands
# ----------------------------------------------------------

clean: cleanup_images cleanup_code cleanup_tests  ## cleanup project

cleanup_tests:
	-rm -r ./coverage

.PHONY: clean cleanup_tests
