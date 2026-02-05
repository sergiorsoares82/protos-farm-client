import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, FileText, Plus, X, User } from 'lucide-react';
import {
  apiService,
  Person,
  StateRegistration,
  CreateStateRegistrationRequest,
  UpdateStateRegistrationRequest,
  RuralProperty,
  LandRegistry,
} from '@/services/api';

const ITEMS_PER_PAGE = 10;
const SITUACAO_OPTIONS = ['ATIVO', 'INATIVO', 'BAIXA', 'SUSPENSO'];

type CnaeRow = {
  codigo: string;
  descricao: string;
};

type ParticipantRow = {
  personId: string;
  cpf: string;
  nome: string;
  participation: string;
};

const defaultForm = {
  personId: '',
  ruralPropertyId: '',
  landRegistryIds: [] as string[],
  numeroIe: '',
  uf: '',
  situacao: 'ATIVO',
  cpfCnpj: '',
  nomeResponsavel: '',
  nomeEstabelecimento: '',
  cnaes: [] as CnaeRow[],
  regimeApuracao: '',
  categoria: '',
  dataInscricao: '',
  dataFimContrato: '',
  dataSituacaoInscricao: '',
  cep: '',
  municipio: '',
  distritoPovoado: '',
  bairro: '',
  logradouro: '',
  numero: '',
  complemento: '',
  referenciaLocalizacao: '',
  optanteProgramaLeite: false,
  participants: [] as ParticipantRow[],
};

export const ProdutoresRurais = () => {
  const [list, setList] = useState<StateRegistration[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [ruralProperties, setRuralProperties] = useState<RuralProperty[]>([]);
  const [landRegistries, setLandRegistries] = useState<LandRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [regsData, personsData, propsData, landRegsData] = await Promise.all([
        apiService.getStateRegistrations(),
        apiService.getPersons(),
        apiService.getRuralProperties(),
        apiService.getLandRegistries(),
      ]);
      setList(regsData);
      setPersons(personsData);
      setRuralProperties(propsData);
      setLandRegistries(landRegsData ?? []);
    } catch (err: unknown) {
      console.error('Error loading produtores rurais:', err);
      setError(err instanceof Error ? err.message : 'Falha ao carregar inscrições estaduais');
    } finally {
      setLoading(false);
    }
  };

  /** Proprietários (pessoas com role FARM_OWNER) para a aba Participantes. */
  const proprietarios = useMemo(
    () => persons.filter((p) => p.roles?.FARM_OWNER),
    [persons]
  );

  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return list;
    return list.filter(
      (sr) =>
        (sr.numeroIe ?? '').toLowerCase().includes(term) ||
        (sr.nomeEstabelecimento ?? '').toLowerCase().includes(term) ||
        (sr.nomeResponsavel ?? '').toLowerCase().includes(term) ||
        (sr.municipio ?? '').toLowerCase().includes(term) ||
        (sr.cpfCnpj ?? '').replace(/\D/g, '').includes(term.replace(/\D/g, ''))
    );
  }, [list, searchTerm]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const formatCep = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}-${digits.slice(5)}`;
  };

  const formatCnaeCodigo = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 7);
    if (!digits) return '';
    if (digits.length <= 4) return digits;
    if (digits.length <= 5) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`;
  };

  const formatCpf = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatNumeroIe = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    if (!digits) return '';
    if (digits.length <= 9) return digits;
    if (digits.length <= 11) {
      return `${digits.slice(0, 9)}.${digits.slice(9)}`;
    }
    return `${digits.slice(0, 9)}.${digits.slice(9, 11)}-${digits.slice(11)}`;
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (sr: StateRegistration) => {
    setEditingId(sr.id);
    let cnaes: CnaeRow[] = [];
    if (sr.cnaeDescricao) {
      try {
        const parsed = JSON.parse(sr.cnaeDescricao);
        if (Array.isArray(parsed)) {
          cnaes = parsed.map((c: any) => ({
            codigo: typeof c.codigo === 'string' ? c.codigo : '',
            descricao: typeof c.descricao === 'string' ? c.descricao : '',
          }));
        }
      } catch {
        // not JSON, fallback below
      }
    }
    if (!cnaes.length && (sr.cnaeCodigo || sr.cnaeDescricao)) {
      cnaes = [
        {
          codigo: sr.cnaeCodigo ?? '',
          descricao: sr.cnaeDescricao ?? '',
        },
      ];
    }
    setFormData({
      personId: sr.personId ?? '',
      ruralPropertyId: sr.ruralPropertyId ?? '' as any,
      landRegistryIds: (sr.landRegistries ?? []).map((lr) => lr.id),
      numeroIe: sr.numeroIe ?? '',
      uf: sr.uf ?? '',
      situacao: sr.situacao ?? 'ATIVO',
      cpfCnpj: sr.cpfCnpj ?? '',
      nomeResponsavel: sr.nomeResponsavel ?? '',
      nomeEstabelecimento: sr.nomeEstabelecimento ?? '',
      cnaes,
      regimeApuracao: sr.regimeApuracao ?? '',
      categoria: sr.categoria ?? '',
      dataInscricao: sr.dataInscricao ?? '',
      dataFimContrato: sr.dataFimContrato ?? '',
      dataSituacaoInscricao: sr.dataSituacaoInscricao ?? '',
      cep: sr.cep ?? '',
      municipio: sr.municipio ?? '',
      distritoPovoado: sr.distritoPovoado ?? '',
      bairro: sr.bairro ?? '',
      logradouro: sr.logradouro ?? '',
      numero: sr.numero ?? '',
      complemento: sr.complemento ?? '',
      referenciaLocalizacao: sr.referenciaLocalizacao ?? '',
      optanteProgramaLeite: sr.optanteProgramaLeite ?? false,
      participants: (sr.participants ?? []).map((p) => {
        const owner = proprietarios.find(
          (o) =>
            (o.cpfCnpj ?? '').replace(/\D/g, '') === (p.cpf ?? '').replace(/\D/g, '')
        );
        return {
          personId: owner?.id ?? '',
          cpf: p.cpf,
          nome: p.nome,
          participation: p.participation ?? '',
        };
      }),
    });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const setForm = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addParticipant = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        { personId: '', cpf: '', nome: '', participation: '' },
      ],
    }));
  };

  const updateParticipant = (
    index: number,
    field: 'personId' | 'participation',
    value: string
  ) => {
    setFormData((prev) => {
      const next = [...prev.participants];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, participants: next };
    });
  };

  const removeParticipant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
  };

  const addCnae = () => {
    setFormData((prev) => ({
      ...prev,
      cnaes: [...prev.cnaes, { codigo: '', descricao: '' }],
    }));
  };

  const updateCnae = (index: number, field: 'codigo' | 'descricao', value: string) => {
    setFormData((prev) => {
      const next = [...prev.cnaes];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, cnaes: next };
    });
  };

  const removeCnae = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      cnaes: prev.cnaes.filter((_, i) => i !== index),
    }));
  };

  const buildPayload = (): CreateStateRegistrationRequest => ({
    ...(formData.personId?.trim() && { personId: formData.personId.trim() }),
    ruralPropertyId:
      formData.ruralPropertyId === ''
        ? null
        : formData.ruralPropertyId,
    landRegistryIds: formData.landRegistryIds,
    numeroIe: formData.numeroIe.trim(),
    uf: formData.uf.trim().toUpperCase().slice(0, 2),
    situacao: formData.situacao,
    ...(formData.cpfCnpj.trim() && { cpfCnpj: formData.cpfCnpj.trim() }),
    ...(formData.nomeResponsavel.trim() && { nomeResponsavel: formData.nomeResponsavel.trim() }),
    ...(formData.nomeEstabelecimento.trim() && { nomeEstabelecimento: formData.nomeEstabelecimento.trim() }),
    ...(formData.regimeApuracao.trim() && { regimeApuracao: formData.regimeApuracao.trim() }),
    ...(formData.categoria.trim() && { categoria: formData.categoria.trim() }),
    ...(formData.dataInscricao.trim() && { dataInscricao: formData.dataInscricao.trim() }),
    ...(formData.dataFimContrato.trim() && { dataFimContrato: formData.dataFimContrato.trim() }),
    ...(formData.dataSituacaoInscricao.trim() && { dataSituacaoInscricao: formData.dataSituacaoInscricao.trim() }),
    ...(formData.cep.trim() && { cep: formData.cep.trim() }),
    ...(formData.municipio.trim() && { municipio: formData.municipio.trim() }),
    ...(formData.distritoPovoado.trim() && { distritoPovoado: formData.distritoPovoado.trim() }),
    ...(formData.bairro.trim() && { bairro: formData.bairro.trim() }),
    ...(formData.logradouro.trim() && { logradouro: formData.logradouro.trim() }),
    ...(formData.numero.trim() && { numero: formData.numero.trim() }),
    ...(formData.complemento.trim() && { complemento: formData.complemento.trim() }),
    ...(formData.referenciaLocalizacao.trim() && { referenciaLocalizacao: formData.referenciaLocalizacao.trim() }),
    ...(formData.cnaes &&
      formData.cnaes.length > 0 && {
        cnaeCodigo: formData.cnaes[0].codigo.trim() || undefined,
        cnaeDescricao: JSON.stringify(
          formData.cnaes
            .map((c) => ({
              codigo: c.codigo.trim(),
              descricao: c.descricao.trim(),
            }))
            .filter((c) => c.codigo || c.descricao),
        ),
      }),
    optanteProgramaLeite: formData.optanteProgramaLeite,
    participants: formData.participants
      .filter((p) => p.cpf.trim() && p.nome.trim())
      .map(({ cpf, nome, participation }) => ({
        cpf,
        nome,
        participation: participation?.toString().trim() || null,
      })),
  });

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!formData.numeroIe.trim()) errors.numeroIe = 'Número da IE é obrigatório';
    if (!formData.uf.trim()) errors.uf = 'UF é obrigatória';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Corrija os campos indicados.');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      const body = buildPayload();
      if (editingId) {
        const updated = await apiService.updateStateRegistration(editingId, body as UpdateStateRegistrationRequest);
        setList((prev) => prev.map((sr) => (sr.id === updated.id ? updated : sr)));
      } else {
        const created = await apiService.createStateRegistration(body);
        setList((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err: unknown) {
      console.error('Error saving state registration:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const personName = (id: string) => persons.find((p) => p.id === id)?.nome ?? id;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">Produtores rurais / Empresas</h1>
            <p className="text-muted-foreground">
              Inscrições estaduais de produtor rural (IE). Emissão e recebimento de notas.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo produtor rural
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Inscrições estaduais</CardTitle>
            <CardDescription>Lista de produtores rurais / empresas cadastrados</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por IE, estabelecimento, responsável, município ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedList.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {filteredList.length === 0 && list.length === 0
                  ? 'Nenhuma inscrição estadual cadastrada. Clique em Novo produtor rural para cadastrar.'
                  : 'Nenhum resultado para a busca.'}
              </p>
            ) : (
              <div className="space-y-2">
                {paginatedList.map((sr) => (
                  <div
                    key={sr.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {sr.nomeEstabelecimento || sr.numeroIe || 'Sem nome'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          IE {sr.numeroIe} · {sr.uf}
                          {sr.municipio && ` · ${sr.municipio}`}
                          {sr.situacao && ` · ${sr.situacao}`}
                        </p>
                        {(sr.landRegistries?.length ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Matrículas: {(sr.landRegistries ?? []).map((lr) => lr.numeroMatricula).join(', ')}
                          </p>
                        )}
                        {sr.nomeResponsavel && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" />
                            {sr.personId ? personName(sr.personId) : '—'}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(sr)}>
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-2 text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar inscrição estadual' : 'Nova inscrição estadual (produtor rural)'}
            </DialogTitle>
            <DialogDescription>
              Dados do comprovante de inscrição estadual de produtor rural (IE).
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{formError}</p>
          )}
          <Tabs defaultValue="cadastrais">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cadastrais">Dados cadastrais</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="participantes">Participantes</TabsTrigger>
            </TabsList>
            <TabsContent value="cadastrais" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número da IE *</Label>
                  <Input
                    value={formData.numeroIe}
                    onChange={(e) => setForm({ numeroIe: formatNumeroIe(e.target.value) })}
                    placeholder="Ex.: 001418131.00-86"
                    maxLength={15}
                  />
                  {fieldErrors.numeroIe && (
                    <p className="text-xs text-destructive">{fieldErrors.numeroIe}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>UF *</Label>
                  <Input
                    value={formData.uf}
                    onChange={(e) => setForm({ uf: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="MG"
                    maxLength={2}
                  />
                  {fieldErrors.uf && <p className="text-xs text-destructive">{fieldErrors.uf}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Situação</Label>
                  <Select
                    value={formData.situacao}
                    onValueChange={(v) => setForm({ situacao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SITUACAO_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>CPF</Label>
                  <Input
                    value={formData.cpfCnpj}
                    onChange={(e) => setForm({ cpfCnpj: formatCpf(e.target.value) })}
                    placeholder="222.283.066-49"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do responsável</Label>
                  <Input
                    value={formData.nomeResponsavel}
                    onChange={(e) => setForm({ nomeResponsavel: e.target.value })}
                    placeholder="LUCAS PIMENTA VEIGA e outro(s)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do estabelecimento / Propriedade rural</Label>
                  <Input
                    value={formData.nomeEstabelecimento}
                    onChange={(e) => setForm({ nomeEstabelecimento: e.target.value })}
                    placeholder="FAZENDA LIMEIRA"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Imóvel rural (opcional)</Label>
                  <Select
                    value={formData.ruralPropertyId || '__none__'}
                    onValueChange={(v) =>
                      setForm({ ruralPropertyId: v === '__none__' ? '' : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o imóvel rural vinculado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Nenhum —</SelectItem>
                      {ruralProperties.map((rp) => (
                        <SelectItem key={rp.id} value={rp.id}>
                          {rp.codigoSncr ? `${rp.codigoSncr} – ` : ''}
                          {rp.nomeImovelIncra}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Um imóvel rural pode ter várias inscrições estaduais.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Matrículas vinculadas (uma ou mais)</Label>
                  {landRegistries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Cadastre matrículas em Matrículas antes de vincular.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {(formData.ruralPropertyId
                        ? landRegistries.filter(
                            (lr) => lr.ruralPropertyId === formData.ruralPropertyId
                          )
                        : landRegistries
                      ).map((lr) => (
                        <div key={lr.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`lr-${lr.id}`}
                            checked={formData.landRegistryIds.includes(lr.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm({
                                landRegistryIds: checked
                                  ? [...formData.landRegistryIds, lr.id]
                                  : formData.landRegistryIds.filter((id) => id !== lr.id),
                              });
                            }}
                            className="rounded"
                          />
                          <label
                            htmlFor={`lr-${lr.id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            {lr.numeroMatricula}
                            {lr.cartorio && ` · ${lr.cartorio}`}
                            {lr.areaHa != null && ` · ${Number(lr.areaHa).toLocaleString('pt-BR')} ha`}
                          </label>
                        </div>
                      ))}
                      {formData.ruralPropertyId &&
                        landRegistries.filter(
                          (lr) => lr.ruralPropertyId === formData.ruralPropertyId
                        ).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma matrícula cadastrada para este imóvel. Selecione matrículas sem
                            filtrar por imóvel ou cadastre matrículas em Matrículas.
                          </p>
                        )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    A inscrição estadual pode estar vinculada a uma ou mais matrículas do imóvel
                    rural.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>CNAE(s)</Label>
                  <div className="space-y-2">
                    {formData.cnaes.map((cnae, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-2 items-center">
                        <Input
                          className="w-full md:w-40"
                          placeholder="0134-2/00"
                          value={cnae.codigo}
                          onChange={(e) =>
                            updateCnae(index, 'codigo', formatCnaeCodigo(e.target.value))
                          }
                          maxLength={9}
                        />
                        <Input
                          className="w-full flex-1"
                          placeholder="Cultivo de café"
                          value={cnae.descricao}
                          onChange={(e) => updateCnae(index, 'descricao', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCnae(index)}
                          className="self-start md:self-center"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addCnae}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar CNAE
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Você pode cadastrar um ou mais CNAE para este produtor rural.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Regime de apuração</Label>
                  <Input
                    value={formData.regimeApuracao}
                    onChange={(e) => setForm({ regimeApuracao: e.target.value })}
                    placeholder="DÉBITO E CRÉDITO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={formData.categoria}
                    onChange={(e) => setForm({ categoria: e.target.value })}
                    placeholder="PRIMEIRO ESTABELECIMENTO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data da inscrição</Label>
                  <Input
                    type="date"
                    value={formData.dataInscricao}
                    onChange={(e) => setForm({ dataInscricao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data do fim do contrato</Label>
                  <Input
                    type="date"
                    value={formData.dataFimContrato}
                    onChange={(e) => setForm({ dataFimContrato: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data da situação da inscrição</Label>
                  <Input
                    type="date"
                    value={formData.dataSituacaoInscricao}
                    onChange={(e) => setForm({ dataSituacaoInscricao: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 md:col-span-2">
                  <Checkbox
                    id="optanteProgramaLeite"
                    checked={formData.optanteProgramaLeite}
                    onCheckedChange={(checked) =>
                      setForm({ optanteProgramaLeite: checked === true })
                    }
                  />
                  <Label htmlFor="optanteProgramaLeite">Optante pelo programa de leite</Label>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="endereco" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => setForm({ cep: formatCep(e.target.value) })}
                    placeholder="37.250-000"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Município</Label>
                  <Input
                    value={formData.municipio}
                    onChange={(e) => setForm({ municipio: e.target.value })}
                    placeholder="NEPOMUCENO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Distrito/Povoado</Label>
                  <Input
                    value={formData.distritoPovoado}
                    onChange={(e) => setForm({ distritoPovoado: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setForm({ bairro: e.target.value })}
                    placeholder="ZONA RURAL"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.logradouro}
                    onChange={(e) => setForm({ logradouro: e.target.value })}
                    placeholder="FAZENDA LIMEIRA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setForm({ numero: e.target.value })}
                    placeholder="S/N"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => setForm({ complemento: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Referência de localização</Label>
                  <Input
                    value={formData.referenciaLocalizacao}
                    onChange={(e) => setForm({ referenciaLocalizacao: e.target.value })}
                    placeholder="KM 2 ESTRADA PORTO DO FARIA"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="participantes" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Participantes da sociedade em comum de produtor rural (proprietários) e sua
                participação percentual.
              </p>
              <div className="space-y-2">
                {formData.participants.map((p, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-2 items-center">
                    <div className="w-full md:flex-1">
                      <Label className="text-xs">Participante (proprietário)</Label>
                      <Select
                        value={p.personId || '__none__'}
                        onValueChange={(v) => {
                          const value = v === '__none__' ? '' : v;
                          const owner = proprietarios.find((o) => o.id === value);
                          setFormData((prev) => {
                            const next = [...prev.participants];
                            next[i] = {
                              ...next[i],
                              personId: value,
                              cpf: owner?.cpfCnpj ?? '',
                              nome: owner?.nome ?? '',
                            };
                            return { ...prev, participants: next };
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o proprietário" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Selecione —</SelectItem>
                          {proprietarios.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.nome}{' '}
                              {owner.cpfCnpj ? `(${owner.cpfCnpj})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-40">
                      <Label className="text-xs">% participação</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="0,00"
                        value={p.participation}
                        onChange={(e) =>
                          updateParticipant(i, 'participation', e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParticipant(i)}
                      className="self-start mt-6 md:mt-5"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar participante
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
