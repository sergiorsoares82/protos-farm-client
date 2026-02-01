"use client"

import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"

export interface AutocompleteOption {
  value: string
  label: string
}

export interface AutocompleteProps {
  options: AutocompleteOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  emptyMessage?: string
}

export const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ options, value, onChange, placeholder = "Digite para buscar...", className, disabled, emptyMessage = "Nenhum resultado encontrado" }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = React.useMemo(() => {
      if (!searchTerm.trim()) return options
      const term = searchTerm.toLowerCase()
      return options.filter((opt) => opt.label.toLowerCase().includes(term))
    }, [options, searchTerm])

    React.useEffect(() => {
      if (selectedOption) {
        setSearchTerm(selectedOption.label)
      } else if (!isOpen) {
        setSearchTerm("")
      }
    }, [selectedOption, isOpen])

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
      
      // Se o valor foi limpo, limpar a seleção
      if (!newValue.trim() && value) {
        onChange?.("")
      }
    }

    const handleSelect = (option: AutocompleteOption) => {
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
        }
      } else if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    const handleFocus = () => {
      setIsOpen(true)
    }

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <div className="relative">
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
        </div>
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-input rounded-md shadow-md max-h-60 overflow-auto">
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex items-center px-3 py-2 cursor-pointer text-sm",
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
        )}
        {isOpen && filteredOptions.length === 0 && searchTerm.trim() && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-input rounded-md shadow-md">
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          </div>
        )}
      </div>
    )
  }
)
Autocomplete.displayName = "Autocomplete"
