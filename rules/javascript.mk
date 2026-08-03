# ----------------------------------------------------------
# javascript.mk
# ----------------------------------------------------------
# Reusable JavaScript/TypeScript targets built on `bun`.
# Hooks into the shared top-level targets from `targets.mk`
# (setup, lint, test, format-check, format-fix, clean,
# distclean). Override variables below in the including
# Makefile to adapt to a project's layout.
# ----------------------------------------------------------

# ----------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------

JS_PKG_MANAGER      ?= bun
JS_LINT_GLOB        ?= '**/*.ts'
JS_FORMAT_GLOB      ?= .
JS_TEST_ARGS        ?= --coverage
JS_BUILD_SCRIPT     ?= build
JS_DIST_DIR         ?= dist
JS_COVERAGE_DIR     ?= coverage
JS_NODE_MODULES_DIR ?= node_modules
JS_HAS_BUILD        ?= 1

# ----------------------------------------------------------
# STANDARD TARGETS
# ----------------------------------------------------------

.PHONY: setup build qa lint test format-check format-fix clean distclean
setup::         js-setup
ifeq ($(JS_HAS_BUILD),1)
build::         js-build
endif
qa::            js-dependencies-audit # Top level (qa = static + test)
lint::          js-lint
test::          js-test
format-check::  js-format-check
format-fix::    js-format-fix
clean::         js-clean
distclean::     js-distclean

# ----------------------------------------------------------
# SETUP
# ----------------------------------------------------------

.PHONY: js-setup
js-setup:  ## ⚙️ Install JavaScript/TypeScript dependencies
	@echo "== Installing JavaScript/TypeScript dependencies..."
	$(JS_PKG_MANAGER) install --dev
	@echo "== JavaScript/TypeScript dependencies installed."

# ----------------------------------------------------------
# DEPENDENCY MANAGEMENT
# ----------------------------------------------------------

.PHONY: js-update
js-update:  ## 📦 Update dependencies
	@echo "== Updating dependencies to latest versions..."
	$(JS_PKG_MANAGER) update --no-progress
	@echo "== Dependency update completed."

.PHONY: js-update-latest
js-update-latest:  ## 📦 Update dependencies to their latest versions
	@echo "== Updating dependencies to latest versions..."
	$(JS_PKG_MANAGER) update --latest --no-progress
	@echo "== Dependency update completed."

.PHONY: js-update-dry-run
js-update-dry-run:  ## 📦 Preview dependency updates without applying them
	@echo "== Previewing dependency updates..."
	$(JS_PKG_MANAGER) update --latest --no-progress --dry-run
	@echo "== Dependency update preview completed."

.PHONY: js-dependencies-audit
js-dependencies-audit:  ## 📦 Audit dependencies for security vulnerabilities
	@echo "== Auditing dependencies for security vulnerabilities..."
	$(JS_PKG_MANAGER) audit > /dev/null 2>&1 || $(JS_PKG_MANAGER) audit
	@echo "== Dependency audit completed."

# ----------------------------------------------------------
# QA
# ----------------------------------------------------------

# ----------------------------------------------------------
# STATIC ANALYSIS
# ----------------------------------------------------------

.PHONY: js-lint
js-lint:  ## 🧹 Lint JavaScript/TypeScript files
	@echo "== Linting JavaScript/TypeScript files..."
	bunx eslint $(JS_LINT_GLOB)
	@echo "== Linting completed."

.PHONY: js-lint-fix
js-lint-fix:  ## 🧹 Lint and autofix JavaScript/TypeScript files
	@echo "== Fixing lint issues in JavaScript/TypeScript files..."
	bunx eslint --fix $(JS_LINT_GLOB)
	@echo "== Lint autofix completed."

# ----------------------------------------------------------
# FORMATTING
# ----------------------------------------------------------

.PHONY: js-format-check
js-format-check:  ## 🎨 Check formatting of project files
	@echo "== Checking formatting..."
	bunx prettier --check $(JS_FORMAT_GLOB)
	@echo "== Format check completed."

.PHONY: js-format-fix
js-format-fix:  ## 🎨 Fix formatting of project files
	@echo "== Fixing formatting..."
	bunx prettier --write $(JS_FORMAT_GLOB)
	@echo "== Format fix completed."

# ----------------------------------------------------------
# TESTS
# ----------------------------------------------------------

.PHONY: js-test
js-test:  ## 🧪 Run JavaScript/TypeScript tests
	@echo "== Running tests..."
	$(JS_PKG_MANAGER) test $(JS_TEST_ARGS)
	@echo "== Tests completed."

# ----------------------------------------------------------
# BUILD
# ----------------------------------------------------------

.PHONY: js-build
js-build:  ## 🚜️ Build the JavaScript/TypeScript project
	@echo "== Building project..."
	$(JS_PKG_MANAGER) run $(JS_BUILD_SCRIPT)
	@echo "== Build completed."

# ----------------------------------------------------------
# CLEANUP
# ----------------------------------------------------------

.PHONY: js-clean
js-clean:  ## 🧹 Remove build and test artifacts
	@echo "== Cleaning up build artifacts..."
	$(RM) -r $(JS_DIST_DIR)
	$(RM) -r $(JS_COVERAGE_DIR)

.PHONY: js-distclean
js-distclean: js-clean  ## 🧹 Remove all generated files, including dependencies
	@echo "== Cleaning up all generated files..."
	$(RM) -r $(JS_NODE_MODULES_DIR)
