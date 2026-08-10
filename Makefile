TOP := .
include $(TOP)/rules/common.mk
include $(TOP)/rules/targets.mk
include $(TOP)/rules/javascript.mk

# ----------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------

EXTJS_BROWSER := chromium
EXTJS_CACHE   := $(shell bun run extension install --where)

# ----------------------------------------------------------
# COMMON TARGETS
# ----------------------------------------------------------

.DEFAULT_GOAL := help

.PHONY: setup build qa lint test format-check format-fix clean distclean

# ----------------------------------------------------------
# COMMON TARGETS on SUBDIRECTORIES
# ----------------------------------------------------------

.PHONY: $(SUBDIRS)
$(SUBDIRS):
	@echo "== make $(MAKECMDGOALS) @ $@"
	@$(MAKE) -C $@ $(MAKECMDGOALS)

setup build qa lint test format-check format-fix clean distclean:: $(SUBDIRS)

# ----------------------------------------------------------
# LOCAL TARGETS - ENVIRONMENT MANAGEMENT
# ----------------------------------------------------------

.PHONY: setup-extension-browser
setup-extension-browser: js-setup  ## ⚙️ Install Chrome browser under Extension.js
	 bun run extension install --browser $(EXTJS_BROWSER)

.PHONY: cleanup-browsers
cleanup-browsers:  ## 🧹 Cleanup browsers installed by Extension.js
	bun run extension uninstall --browser $(EXTJS_BROWSER)

.PHONY: list-browsers
list-browsers:  ## 🏄 List browsers available to Extension.js
	find $(EXTJS_CACHE) -name MacOS -print0 \
		| xargs -0 -I _ find _ -type f -perm +111 -print \
		| grep -v Helper \
		| sort

.PHONY: js-update-gradual
js-update-gradual:  ## 📦 Update dependencies gradually while checking stability

	@echo "== Gradual dependency update..."
	@cp -p package.json package.json.before-update
	bun outdated
	@echo "== Dry run..."
	@$(MAKE) js-update-dry-run

	@echo "== Updating dependencies..."
	@$(MAKE) js-update
	@cp -p package.json package.json.after-update
	@$(MAKE) qa

	@echo "== Updating dependencies..."
	@$(MAKE) js-update-latest
	@cp -p package.json package.json.after-update-latest
	@$(MAKE) qa

	@diff package.json package.json.before-update > /dev/null \
		&& echo "\n[Makefile] There were no updates to dependencies." \
		|| echo "\n[Makefile] There were updates to dependencies. Please create a 'chore' commit."


# ----------------------------------------------------------
# LOCAL TARGETS - DEVELOPMENT
# ----------------------------------------------------------

.PHONY: dev preview show

dev: images  ## 🧑‍💻 Starts a development server with hot reloading
	bun extension dev --browser $(EXTJS_BROWSER)

preview: images  ## 👀 Previews the extension in production without building
	bun run extension preview --browser $(EXTJS_BROWSER)

show: build
	@tree -sat dist/chrome

# ----------------------------------------------------------
# CHILD TARGETS
# ----------------------------------------------------------

.PHONY: images
images:  ## 🖼️ Build extension's images
	@$(MAKE) -C images images

.PHONY: cleanup-images
cleanup-images:  ## 🧹 Cleanup processed images
	@$(MAKE) -C images clean

# ----------------------------------------------------------
# EXTEND COMMON TARGETS
# ----------------------------------------------------------

setup:: setup-extension-browser
build:: package
clean:: cleanup-images
distclean:: cleanup-browsers

# ----------------------------------------------------------
# Temporary: targets we want to standardize and move to a rule/*.mk
# ----------------------------------------------------------

.PHONY: package
package: images build  ## 🎁 Package the extension as a ZIP file for store submission
	bun run extension build --zip
	@EXTJS_ZIP=$(shell ls -t dist/$(EXTJS_BROWSER)/*.zip | head -n 1) \
		&& echo "== Packaged extension: $$EXTJS_ZIP" \
		|| echo "== No ZIP file found in dist/$(EXTJS_BROWSER)/"
