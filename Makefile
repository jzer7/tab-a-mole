all: lint format build

.PHONY: all

lint:  ## review code for Javascript issues
	npm run lint

format:  ## consistent formatting of JS, HTML and CSS files
	npm run prettier

dev:  ## starts a development server with hot reloading
	npm run dev

preview:  ## previews the extension in production without building
	npm run preview

build: ## builds a production version of the extension
	npm run prepare
	npm run build

package: build ## produce the .zip artifact
	npm run package
	mkdir -p dist
	cp -p src/dist/chrome/tab-a-mole-1.0.zip dist

.PHONY: lint format dev preview build package

show: build
	@tree -sat src/dist/chrome

clean: ## cleanup development environment
	npx extension cleanup
	#-find . -name dist -not -path '*/node_modules/*' -delete -print
	-rm -r ./src/dist ./dist

.PHONY: show
