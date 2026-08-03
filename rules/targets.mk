# ----------------------------------------------------------
# targets.mk
# ----------------------------------------------------------
# This makefile module adds top-level targets that can be
# extended by other Makefiles.
# Each component's Makefile can chain additional operations
# to the shared top-level targets below using the :: syntax.
# Look at `python.mk` for reference.
#
# Top-level targets:
#  - setup:        set up the development environment
#  - build:        build artifacts
#  - qa:           run all quality assurance checks
#  - lint:         run linters
#  - test:         run tests
#  - format-check: check code formatting
#  - format-fix:   fix code formatting
#  - clean:        remove build artifacts
#  - distclean:    remove all generated files
# ----------------------------------------------------------
# Instructions for extending targets in a component's Makefile:
#
#   setup::
#		mkdir -p tmp-dir-for-fun
#
#	clean:: txt-clean
#
#	.PHONY: txt-clean
#	txt-clean:
# 		rm old-unused-text-file.txt
# 		rm another-old-unused-text-file.txt
# ----------------------------------------------------------


.PHONY: all
all:: help

# ----------------------------------------------------------
# SETUP
# ----------------------------------------------------------

.PHONY: setup
setup::  ## ⚙️ Setup the development environment
	@echo "== Setting up the development environment..."

# ----------------------------------------------------------
# QA
# ----------------------------------------------------------

.PHONY: qa
qa:: static test  ## ✅ Run all quality assurance checks
	@echo "== All QA checks passed successfully!"

# ----------------------------------------------------------
# STATIC ANALYSIS
# ----------------------------------------------------------

.PHONY: static
static:: lint format-check  ## 🔍 Run static analysis

.PHONY: lint
lint::  ## 🧹 Run linters
	@echo "== Linting completed successfully!"

# ----------------------------------------------------------
# FORMATTING
# ----------------------------------------------------------

.PHONY: format-check
format-check::  ## 🎨 Check formatting
	@echo "== Format check completed successfully!"

.PHONY: format-fix
format-fix::  ## 🎨 Fix formatting
	@echo "== Format fix completed successfully!"

# ----------------------------------------------------------
# TESTS
# ----------------------------------------------------------

.PHONY: test
test::  ## 🧪 Run all tests
	@echo "== All tests completed successfully!"

# ----------------------------------------------------------
# BUILD
# ----------------------------------------------------------

.PHONY: build
build::  ## 🚜️ Build artifacts
	@echo "== Build completed successfully!"

# ----------------------------------------------------------
# CLEANUP
# ----------------------------------------------------------

.PHONY: clean
clean::  ## 🧹 Clean up build artifacts
	@echo "== Cleaning up build artifacts..."

.PHONY: distclean
distclean:: clean  ## 🧹 Clean up all generated files
	@echo "== Cleaning up all generated files..."
