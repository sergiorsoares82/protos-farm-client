import { useMemo } from 'react';
import { CostCenter } from '@/services/api';
import { Autocomplete } from '@/components/ui/autocomplete';

/**
 * Builds breadcrumb path for a cost center (e.g. "Leite > Ordenha > Ordenhadeira").
 */
export function buildCostCenterPath(cc: CostCenter, all: CostCenter[]): string {
  const parts: string[] = [];
  let current: CostCenter | undefined = cc;
  while (current) {
    parts.unshift(current.name ?? current.description ?? current.code);
    const parentId = current.parentId ?? undefined;
    if (!parentId) break;
    current = all.find((c) => c.id === parentId);
  }
  return parts.join(' > ');
}

export interface CostCenterSelectWithPathProps {
  costCenters: CostCenter[];
  value: string;
  onChange: (costCenterId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Typeahead select for cost center that shows breadcrumb path (e.g. "Leite > Ordenha > Ordenhadeira").
 */
export function CostCenterSelectWithPath({
  costCenters,
  value,
  onChange,
  placeholder = 'Selecione ou busque um centro de custo',
  disabled,
  className,
}: CostCenterSelectWithPathProps) {
  const options = useMemo(() => {
    return costCenters.map((cc) => ({
      value: cc.id,
      label: buildCostCenterPath(cc, costCenters),
    }));
  }, [costCenters]);

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      minSearchChars={0}
    />
  );
}
