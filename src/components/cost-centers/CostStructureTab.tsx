import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronRight, ChevronDown, BarChart3 } from 'lucide-react';
import { apiService, CostCenterTreeNode } from '@/services/api';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const CostStructureTab = () => {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<CostCenterTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCostCenterTreeWithCosts(fromDate, toDate);
      setNodes(data);
      setExpandedIds(new Set(data.filter((n) => n.temFilhos).map((n) => n.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar estrutura de custos');
      setNodes([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const childIdsByParent = useMemo(() => {
    const map = new Map<string | null, string[]>();
    for (const n of nodes) {
      const pid = n.parentId;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(n.id);
    }
    return map;
  }, [nodes]);

  const visibleRows = useMemo(() => {
    const result: CostCenterTreeNode[] = [];
    const visit = (parentId: string | null) => {
      const ids = childIdsByParent.get(parentId) ?? [];
      for (const id of ids) {
        const node = nodes.find((n) => n.id === id);
        if (!node) continue;
        result.push(node);
        if (node.temFilhos && expandedIds.has(node.id)) {
          visit(node.id);
        }
      }
    };
    visit(null);
    return result;
  }, [nodes, childIdsByParent, expandedIds]);

  const parentTotalMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of nodes) {
      if (n.parentId) {
        const parent = nodes.find((p) => p.id === n.parentId);
        if (parent) map.set(n.id, parent.custoTotal);
      }
    }
    return map;
  }, [nodes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estrutura de custos (Custo direto vs total)
        </CardTitle>
        <CardDescription>
          Período das notas fiscais para agregação. Custo direto: valor lançado no centro. Custo total: direto + filhos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-date">De</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date">Até</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={loadTree} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Centro de custo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Custo direto (R$)</TableHead>
                <TableHead className="text-right">Custo total (R$)</TableHead>
                <TableHead className="text-right">% do pai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Defina o período e clique em Atualizar para carregar a estrutura.
                  </TableCell>
                </TableRow>
              )}
              {visibleRows.map((row) => {
                const parentTotal = parentTotalMap.get(row.id);
                const pctParent = parentTotal != null && parentTotal > 0
                  ? (row.custoTotal / parentTotal) * 100
                  : null;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${row.nivel * 20}px` }}
                      >
                        {row.temFilhos ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.id)}
                            className="p-0.5 rounded hover:bg-muted"
                            aria-label={expandedIds.has(row.id) ? 'Recolher' : 'Expandir'}
                          >
                            {expandedIds.has(row.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-5 inline-block" />
                        )}
                        <span className="font-medium">{row.name ?? row.description}</span>
                        {row.code && (
                          <span className="text-muted-foreground text-sm">({row.code})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{row.kind} / {row.type}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(row.custoDireto)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(row.custoTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {pctParent != null ? `${pctParent.toFixed(1)}%` : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
