all: lint format build

.PHONY: all

lint:  ## review code for Javascript issues
	npm run lint

format:  ## consistent formatting of JS, HTML and CSS files
	npm run prettier

dev:  ## open a sandboxed chrome with the DEV build for the extension
	npm run dev

preview:  ## open a sandboxed chrome with the PROD build for the extension
	npm run preview

build: ## build a PROD version of the extension
	npm run prepare
	npm run build

.PHONY: lint format build

show: build
	@tree -sat src/dist/chrome

.PHONY: show
