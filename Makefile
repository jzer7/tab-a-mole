all: prepare build
.PHONY: all

# ----------------------------------------------------------
# Image Processing Commands
# ----------------------------------------------------------
images: ## process images for the extension
	$(MAKE) -C images build

cleanup_images: ## cleanup processed images
	$(MAKE) -C images clean

.PHONY: images cleanup_images

# ----------------------------------------------------------
# Development and Build Commands
# ----------------------------------------------------------

prepare: lint format

lint:  ## review code for Javascript issues
	bun run lint

format:  ## consistent formatting of JS, HTML and CSS files
	bun run prettier

test:  ## runs unit tests
	bun run test

dev: images  ## starts a development server with hot reloading
	bun run dev

preview: images  ## previews the extension in production without building
	bun run preview

build: images  ## builds a production version of the extension
	bun run prepare
	bun run build

package: build  ## produce the .zip artifact
	bun run package
	mkdir -p dist
	cp -p dist/chrome/tab-a-mole-1.0.zip .

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
