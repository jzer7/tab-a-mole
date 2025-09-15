all: prepare build
.PHONY: all

# ----------------------------------------------------------
# Image Processing Commands
# ----------------------------------------------------------
images: ## process images for the extension
	$(MAKE) -C src/images build

cleanup_images: ## cleanup processed images
	$(MAKE) -C src/images clean

.PHONY: images cleanup_images

# ----------------------------------------------------------
# Development and Build Commands
# ----------------------------------------------------------

prepare: lint format

lint:  ## review code for Javascript issues
	npm run lint

format:  ## consistent formatting of JS, HTML and CSS files
	npm run prettier

dev: images  ## starts a development server with hot reloading
	npm run dev

preview: images  ## previews the extension in production without building
	npm run preview

build: images  ## builds a production version of the extension
	npm run prepare
	npm run build

package: build  ## produce the .zip artifact
	npm run package
	mkdir -p dist
	cp -p src/dist/chrome/tab-a-mole-1.0.zip dist

cleanup_code: ## cleanup development environment
	npx extension cleanup
	#-find . -name dist -not -path '*/node_modules/*' -delete -print
	-rm -r ./src/dist ./dist

.PHONY: prepare lint format dev preview build package cleanup_code

show: build
	@tree -sat src/dist/chrome

.PHONY: show

# ----------------------------------------------------------
# Cleanup Commands
# ----------------------------------------------------------

clean: cleanup_images cleanup_code ## cleanup project

.PHONY: clean
