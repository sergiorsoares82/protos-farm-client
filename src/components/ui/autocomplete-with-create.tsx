"use client"

import * as React from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Plus, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AutocompleteOption {
  value: string
  label: string
}

export interface AutocompleteWithCreateProps {
  options: AutocompleteOption[]
  value?: string
  onChange?: (value: string) => void
  onCreateClick?: (searchTerm: string) => void
  onDropdownOpenChange?: (open: boolean) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  emptyMessage?: string
  createButtonText?: string
}

export const AutocompleteWithCreate = React.forwardRef<HTMLInputElement, AutocompleteWithCreateProps>(
  ({ 
    options, 
    value, 
    onChange, 
    onCreateClick,
    onDropdownOpenChange,
    placeholder = "Digite para buscar...", 
    className, 
    disabled, 
    emptyMessage = "Nenhum resultado encontrado",
    createButtonText = "Criar novo"
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const justSelectedRef = React.useRef(false)

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = React.useMemo(() => {
      if (!searchTerm.trim()) return options
      const term = searchTerm.toLowerCase()
      return options.filter((opt) => opt.label.toLowerCase().includes(term))
    }, [options, searchTerm])

    const showCreateButton = React.useMemo(() => {
      const hasText = searchTerm.trim().length > 0
      const hasMatches = filteredOptions.length > 0
      const isNotSelected = !value || !selectedOption || searchTerm !== selectedOption.label
      return hasText && !hasMatches && isNotSelected && !!onCreateClick
    }, [searchTerm, filteredOptions.length, value, selectedOption, onCreateClick])

    React.useEffect(() => {
      onDropdownOpenChange?.(isOpen)
    }, [isOpen, onDropdownOpenChange])

    // Só sincroniza o texto quando o dropdown está fechado; quando aberto deixa o usuário editar
    React.useEffect(() => {
      if (!isOpen) {
        if (selectedOption) {
          setSearchTerm(selectedOption.label)
        } else if (!value) {
          setSearchTerm("")
        }
      }
    }, [selectedOption, value, isOpen])

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (justSelectedRef.current) {
          justSelectedRef.current = false
          return
        }
        const target = event.target as Node
        const inContainer = containerRef.current?.contains(target)
        const inDropdown = dropdownRef.current?.contains(target)
        if (!inContainer && !inDropdown) {
          setIsOpen(false)
          if (selectedOption) {
            setSearchTerm(selectedOption.label)
          } else {
            setSearchTerm("")
          }
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [selectedOption])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setSearchTerm(newValue)
      setIsOpen(true)
      setHighlightedIndex(-1)
      
      if (!newValue.trim() && value) {
        onChange?.("")
      }
    }

    const handleSelect = (option: AutocompleteOption) => {
      justSelectedRef.current = true
      onChange?.(option.value)
      setSearchTerm(option.label)
      setIsOpen(false)
      inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        setIsOpen(true)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        } else if (showCreateButton && onCreateClick) {
          handleCreateClick()
        }
      } else if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    const handleFocus = () => {
      setIsOpen(true)
    }

    const handleCreateClick = () => {
      if (onCreateClick && searchTerm.trim()) {
        onCreateClick(searchTerm.trim())
      }
    }

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-8"
            />
            <ChevronsUpDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            {isOpen &&
              (filteredOptions.length > 0 ? (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-popover shadow-md"
                >
                  {filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      role="option"
                      data-option-value={option.value}
                      aria-selected={option.value === value}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(option)
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        handleSelect(option)
                      }}
                      className={cn(
                        "flex cursor-pointer items-center px-3 py-2 text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        index === highlightedIndex && "bg-accent text-accent-foreground",
                        option.value === value && "bg-accent/50"
                      )}
                    >
                      {option.value === value && (
                        <Check className="mr-2 h-4 w-4 text-primary" />
                      )}
                      <span className={cn(option.value === value && "font-medium")}>
                        {option.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : searchTerm.trim() && !showCreateButton ? (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-input bg-popover shadow-md"
                >
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {emptyMessage}
                  </div>
                </div>
              ) : null)}
          </div>
          {showCreateButton && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCreateClick}
              title={createButtonText}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)
AutocompleteWithCreate.displayName = "AutocompleteWithCreate"
