import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Dimensions, NativeSyntheticEvent,
  NativeScrollEvent, Modal, Alert, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import { Usuario } from '../src/types/Usuario';
import { Produto } from '../src/types/Produto';
import { Categoria } from '../src/types/Categoria';
import { Avaliacao } from '../src/types/Avaliacao';
import { getProdutos, createProduto, updateProduto, deactivateProduto, deleteProduto, uploadFoto, getProdutoFotoUrl } from '../src/services/produtoService';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../src/services/categoriaService';
import { getAvaliacoesByProduto, createAvaliacao, updateAvaliacao, deleteAvaliacao } from '../src/services/avaliacaoService';
import { deleteUsuario, updateUsuario } from '../src/services/usuarioService';
import { API_URL } from '../src/services/api';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const TABS = ['Feed', 'Busca', 'Perfil'];

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activePage, setActivePage] = useState(0);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfilNome, setPerfilNome] = useState('');
  const [perfilEmail, setPerfilEmail] = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);

  // ── Dados da API ──
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [meusProdutos, setMeusProdutos] = useState<Produto[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [categoriaNome, setCategoriaNome] = useState('');
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<number | null>(null);
  const [savingCategoria, setSavingCategoria] = useState(false);

  const fetchProdutos = useCallback(async (categoriaId?: number) => {
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const data = await getProdutos(categoriaId ? { categoriaId } : undefined);
      setProdutos(data.filter(p => p.statusProduto === 'ATIVO'));
    } catch (e) {
      setFeedError(e instanceof Error ? e.message : 'Erro ao carregar produtos');
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  // BUG 1 — deduplicar por id E por nome (cobre duplicatas do backend com IDs diferentes)
  const fetchCategorias = useCallback(async () => {
    try {
      const data = await getCategorias();
      const vistas = new Set<string>();
      const unicas = data.filter(c => {
        const chave = c.nome.trim().toLowerCase();
        if (vistas.has(chave)) return false;
        vistas.add(chave);
        return true;
      });
      setCategorias(unicas);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao carregar categorias');
    }
  }, []);

  // BUG 2 — buscar produtos do usuário logado
  const fetchMeusProdutos = useCallback(async (usuarioId: number) => {
    try {
      const data = await getProdutos({ usuarioId });
      setMeusProdutos(data);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao carregar seus anuncios');
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('usuario').then((value) => {
      if (value) {
        const u = JSON.parse(value) as Usuario;
        setUsuario(u);
        setPerfilNome(u.nome);
        setPerfilEmail(u.username);
        fetchMeusProdutos(u.id);
      }
    });
    fetchProdutos();
    fetchCategorias();
  }, [fetchProdutos, fetchCategorias, fetchMeusProdutos]);

  // BUG 6 — recarregar feed ao focar a tela
  useFocusEffect(
    useCallback(() => {
      fetchProdutos();
    }, [fetchProdutos])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProdutos();
    setRefreshing(false);
  }, [fetchProdutos]);

  async function handleLogout() {
    await AsyncStorage.removeItem('usuario');
    await AsyncStorage.removeItem('usuarioId');
    router.replace('/welcome');
  }

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adNome, setAdNome] = useState('');
  const [adDescricao, setAdDescricao] = useState('');
  const [adTelefone, setAdTelefone] = useState('');
  const [adEmail, setAdEmail] = useState('');
  const [adCategoria, setAdCategoria] = useState<number | null>(null);
  const [adFotoUri, setAdFotoUri] = useState<string | null>(null);
  const [publishingAd, setPublishingAd] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null); // null = criar, number = editar
  const [selectedAd, setSelectedAd] = useState<Produto | null>(null);

  // ── Avaliações do anúncio selecionado ──
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [avaliacaoEditandoId, setAvaliacaoEditandoId] = useState<number | null>(null);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (!selectedAd) { setAvaliacoes([]); return; }
    getAvaliacoesByProduto(selectedAd.id)
      .then(setAvaliacoes)
      .catch(() => setAvaliacoes([]));
  }, [selectedAd]);

  async function handleEnviarComentario() {
    if (!novoComentario.trim() || !selectedAd || !usuario) return;
    setSendingComment(true);
    try {
      if (avaliacaoEditandoId !== null) {
        await updateAvaliacao(avaliacaoEditandoId, novoComentario.trim());
        setAvaliacaoEditandoId(null);
      } else {
        await createAvaliacao({ produtoId: selectedAd.id, usuarioId: usuario.id, comentario: novoComentario.trim() });
      }
      const updated = await getAvaliacoesByProduto(selectedAd.id);
      setAvaliacoes(updated);
      setNovoComentario('');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao enviar comentário');
    } finally {
      setSendingComment(false);
    }
  }

  async function handleSalvarPerfil() {
    if (!usuario) return;
    if (!perfilNome.trim() || !perfilEmail.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha nome e e-mail.');
      return;
    }
    setSavingPerfil(true);
    try {
      const atualizado = await updateUsuario(usuario.id, {
        nome: perfilNome.trim(),
        username: perfilEmail.trim(),
      });
      setUsuario(atualizado);
      await AsyncStorage.setItem('usuario', JSON.stringify(atualizado));
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao atualizar perfil');
    } finally {
      setSavingPerfil(false);
    }
  }

  async function handleSalvarCategoria() {
    if (!categoriaNome.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome da categoria.');
      return;
    }
    setSavingCategoria(true);
    try {
      if (categoriaEditandoId !== null) {
        await updateCategoria(categoriaEditandoId, categoriaNome.trim());
      } else {
        await createCategoria(categoriaNome.trim());
      }
      setCategoriaNome('');
      setCategoriaEditandoId(null);
      await fetchCategorias();
      Alert.alert('Categoria salva', 'A lista de categorias foi atualizada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar categoria');
    } finally {
      setSavingCategoria(false);
    }
  }

  function handleEditarCategoria(categoria: Categoria) {
    setCategoriaEditandoId(categoria.id);
    setCategoriaNome(categoria.nome);
  }

  function handleExcluirCategoria(categoria: Categoria) {
    Alert.alert('Excluir categoria', `Deseja excluir "${categoria.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategoria(categoria.id);
            if (selectedCategory === categoria.id) setSelectedCategory(null);
            if (adCategoria === categoria.id) setAdCategoria(null);
            await fetchCategorias();
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao excluir categoria');
          }
        },
      },
    ]);
  }

  function handleEditarAvaliacao(avaliacao: Avaliacao) {
    setAvaliacaoEditandoId(avaliacao.id);
    setNovoComentario(avaliacao.comentario);
  }

  function handleExcluirAvaliacao(avaliacao: Avaliacao) {
    if (!selectedAd) return;
    Alert.alert('Excluir avaliação', 'Deseja excluir este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAvaliacao(avaliacao.id);
            const updated = await getAvaliacoesByProduto(selectedAd.id);
            setAvaliacoes(updated);
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao excluir avaliação');
          }
        },
      },
    ]);
  }

  async function handleSelecionarFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      // Validação de tamanho: 5 MB
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Imagem muito grande', 'O limite é 5 MB. Escolha uma imagem menor.');
        return;
      }
      // Validação de tipo
      const ext = (asset.uri.split('.').pop() ?? '').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        Alert.alert('Formato inválido', 'Use imagens JPG, PNG ou WEBP.');
        return;
      }
      setAdFotoUri(asset.uri);
    }
  }

  async function handleDesativarConta() {
    Alert.alert(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta permanentemente?\n\nTodos os seus anuncios e avaliacoes serao removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            if (!usuario) return;
            try {
              await deleteUsuario(usuario.id);
              await AsyncStorage.multiRemove(['usuario', 'usuarioId']);
              router.replace('/welcome');
            } catch (e) {
              Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao excluir conta');
            }
          },
        },
      ]
    );
  }

  async function handlePublicar() {
    if (!adNome || !adDescricao || !adCategoria) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, descrição e categoria.');
      return;
    }
    if (!usuario) {
      Alert.alert('Erro', 'Usuário não identificado.');
      return;
    }
    setPublishingAd(true);
    try {
      if (editandoId !== null) {
        // ── EDITAR produto existente ──
        await updateProduto(editandoId, {
          nome: adNome,
          descricao: adDescricao,
          telefone: adTelefone || undefined,
          email: adEmail || undefined,
          categoriaId: adCategoria,
        });
        // Upload de foto separado se selecionou uma nova imagem local
        if (adFotoUri && (adFotoUri.startsWith('file://') || adFotoUri.startsWith('content://'))) {
          await uploadFoto(editandoId, adFotoUri);
        }
        Alert.alert('Anúncio atualizado!', `"${adNome}" foi atualizado com sucesso.`);
      } else {
        // ── CRIAR novo produto ──
        const novoProduto = await createProduto({
          nome: adNome,
          descricao: adDescricao,
          telefone: adTelefone || undefined,
          email: adEmail || undefined,
          usuarioId: usuario.id,
          categoriaId: adCategoria,
          statusProduto: 'ATIVO',
        });
        // Upload da foto com o ID retornado pelo backend
        if (adFotoUri) {
          await uploadFoto(novoProduto.id, adFotoUri);
        }
        Alert.alert('Anúncio publicado!', `"${adNome}" foi anunciado com sucesso.`);
      }
      setModalVisible(false);
      setEditandoId(null);
      setAdNome(''); setAdDescricao(''); setAdTelefone(''); setAdEmail(''); setAdCategoria(null); setAdFotoUri(null);
      fetchProdutos();
      fetchMeusProdutos(usuario.id);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar anúncio');
    } finally {
      setPublishingAd(false);
    }
  }

  function handleEditar(produto: Produto) {
    setEditandoId(produto.id);
    setAdNome(produto.nome);
    setAdDescricao(produto.descricao);
    setAdTelefone(produto.telefone ?? '');
    setAdEmail(produto.email ?? '');
    setAdCategoria(produto.categoria?.id ?? null);
    setAdFotoUri(produto.temFoto ? getProdutoFotoUrl(produto.id) : null);
    setSelectedAd(null);
    setModalVisible(true);
  }

  function handleDesativar(produto: Produto) {
    Alert.alert(
      'Desativar anúncio',
      `Deseja desativar "${produto.nome}"? Ele não aparecerá mais no feed.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar', style: 'destructive',
          onPress: async () => {
            try {
              await deactivateProduto(produto.id);
              setSelectedAd(null);
              fetchProdutos();
              if (usuario) fetchMeusProdutos(usuario.id);
            } catch (e) {
              Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao desativar');
            }
          },
        },
      ]
    );
  }

  function handleExcluirProduto(produto: Produto) {
    Alert.alert(
      'Excluir anúncio',
      `Tem certeza que deseja excluir "${produto.nome}" permanentemente?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduto(produto.id);
              setSelectedAd(null);
              fetchProdutos();
              if (usuario) fetchMeusProdutos(usuario.id);
            } catch (e) {
              Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao excluir anúncio');
            }
          },
        },
      ]
    );
  }

  function goToPage(index: number) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActivePage(index);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setActivePage(page);
  }

  // BUG 7 — filtrar por nome, descrição e categoria.nome (case-insensitive)
  const q = search.toLowerCase();
  const filteredAds = produtos.filter(p => {
    const matchSearch = !q
      || p.nome.toLowerCase().includes(q)
      || (p.descricao ?? '').toLowerCase().includes(q)
      || (p.categoria?.nome ?? '').toLowerCase().includes(q);
    const matchCategory = selectedCategory ? p.categoria?.id === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => goToPage(i)}>
            <Text style={[styles.tabText, activePage === i && styles.tabTextActive]}>{tab}</Text>
            {activePage === i && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {/* ── PÁGINA 1: FEED ── */}
        <View style={styles.page}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          >
            <Text style={styles.pageTitle}>Anúncios recentes</Text>
            {loadingFeed && !refreshing && <ActivityIndicator color={Colors.primary} />}
            {feedError && <Text style={{ color: Colors.danger, textAlign: 'center' }}>{feedError}</Text>}
            {produtos.map(ad => (
              <TouchableOpacity key={ad.id} style={styles.adCard} activeOpacity={0.85} onPress={() => setSelectedAd(ad)}>
                {ad.temFoto
                  ? <Image source={{ uri: `${API_URL}/produtos/${ad.id}/foto` }} style={styles.adImagePlaceholder} resizeMode="cover" />
                  : <View style={styles.adImagePlaceholder}><Ionicons name="image-outline" size={36} color={Colors.primaryDark} /></View>
                }
                <View style={styles.adInfo}>
                  <View style={styles.adCategoryBadge}>
                    <Text style={styles.adCategoryText}>{ad.categoria?.nome ?? ''}</Text>
                  </View>
                  <Text style={styles.adTitle}>{ad.nome}</Text>
                  <Text style={styles.adDescription} numberOfLines={2}>{ad.descricao}</Text>
                  <View style={styles.adMeta}>
                    <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.adMetaText}>{ad.usuario?.nome ?? ''}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── PÁGINA 2: BUSCA ── */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.feedContent}>
            <Text style={styles.pageTitle}>Buscar materiais</Text>

            {/* Barra de busca */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={Colors.placeholder} />
              <TextInput
                style={styles.searchInput}
                placeholder="O que você procura?"
                placeholderTextColor={Colors.placeholder}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.placeholder} />
                </TouchableOpacity>
              )}
            </View>

            {/* Categorias */}
            <View style={styles.categoriesGrid}>
              {categorias.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, selectedCategory === cat.id && styles.categoryCardActive]}
                  onPress={() => {
                    const next = selectedCategory === cat.id ? null : cat.id;
                    setSelectedCategory(next);
                    fetchProdutos(next ?? undefined);
                  }}
                >
                  <Ionicons name="leaf-outline" size={28} color={selectedCategory === cat.id ? Colors.textLight : Colors.primary} />
                  <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resultados */}
            <Text style={styles.sectionLabel}>
              {filteredAds.length} resultado{filteredAds.length !== 1 ? 's' : ''}
            </Text>
            {filteredAds.map(ad => (
              <TouchableOpacity key={ad.id} style={styles.adCard} activeOpacity={0.85} onPress={() => setSelectedAd(ad)}>
                {ad.temFoto
                  ? <Image source={{ uri: `${API_URL}/produtos/${ad.id}/foto` }} style={styles.adImagePlaceholder} resizeMode="cover" />
                  : <View style={styles.adImagePlaceholder}><Ionicons name="image-outline" size={36} color={Colors.primaryDark} /></View>
                }
                <View style={styles.adInfo}>
                  <View style={styles.adCategoryBadge}>
                    <Text style={styles.adCategoryText}>{ad.categoria?.nome ?? ''}</Text>
                  </View>
                  <Text style={styles.adTitle}>{ad.nome}</Text>
                  <Text style={styles.adDescription} numberOfLines={2}>{ad.descricao}</Text>
                  <View style={styles.adMeta}>
                    <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.adMetaText}>{ad.usuario?.nome ?? ''}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── PÁGINA 3: PERFIL ── */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.feedContent}>
            <Text style={styles.pageTitle}>Meu perfil</Text>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={52} color={Colors.primaryDark} />
              </View>
              <TouchableOpacity style={styles.avatarEditBtn}>
                <Ionicons name="camera-outline" size={16} color={Colors.textLight} />
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Toque na câmera para alterar a foto</Text>
            </View>

            {/* Campos */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor={Colors.placeholder}
                  value={perfilNome}
                  onChangeText={setPerfilNome}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={Colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={Colors.placeholder}
                  value={perfilEmail}
                  onChangeText={setPerfilEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <TouchableOpacity style={[styles.btnPrimary, savingPerfil && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSalvarPerfil} disabled={savingPerfil}>
              {savingPerfil
                ? <ActivityIndicator color={Colors.textLight} />
                : <Text style={styles.btnPrimaryText}>Salvar perfil</Text>}
            </TouchableOpacity>

            {/* BUG 2 — anúncios do usuário */}
           <View style={styles.myAdsHeader}>
  <Text style={styles.myAdsTitle}>Meus anúncios</Text>
  <View style={styles.myAdsBadge}>
    <Text style={styles.myAdsBadgeText}>{meusProdutos.length}</Text>
  </View>
</View>

<TouchableOpacity
  style={styles.btnAnunciar}
  activeOpacity={0.85}
  onPress={() => {
    setEditandoId(null);
    setAdNome('');
    setAdDescricao('');
    setAdTelefone('');
    setAdEmail('');
    setAdCategoria(null);
    setAdFotoUri(null);
    setModalVisible(true);
  }}
>
  <Ionicons name="add-circle-outline" size={20} color={Colors.textLight} />
  <Text style={styles.btnAnunciarText}>Anunciar material</Text>
</TouchableOpacity>
            {meusProdutos.length === 0
              ? <Text style={styles.reviewEmpty}>Você ainda não publicou nenhum anúncio.</Text>
              : meusProdutos.map(p => (
                <View key={p.id}>
                  <TouchableOpacity style={styles.adCard} activeOpacity={0.85} onPress={() => setSelectedAd(p)}>
                    {p.temFoto
                      ? <Image source={{ uri: `${API_URL}/produtos/${p.id}/foto` }} style={styles.adImagePlaceholder} resizeMode="cover" />
                      : <View style={styles.adImagePlaceholder}><Ionicons name="image-outline" size={36} color={Colors.primaryDark} /></View>
                    }
                    <View style={styles.adInfo}>
                      <View style={styles.adCategoryBadge}>
                        <Text style={styles.adCategoryText}>{p.categoria?.nome ?? ''}</Text>
                      </View>
                      <Text style={styles.adTitle}>{p.nome}</Text>
                      <Text style={styles.adDescription} numberOfLines={2}>{p.descricao}</Text>
                    </View>
                  </TouchableOpacity>
                  {/* Botões de ação do próprio produto */}
                  <View style={styles.adActions}>
                    <TouchableOpacity style={styles.btnAction} onPress={() => handleEditar(p)}>
                      <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
                      <Text style={styles.btnActionText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnActionDelete} onPress={() => handleExcluirProduto(p)}>
                      <Ionicons name="trash-outline" size={15} color={Colors.textLight} />
                      <Text style={styles.btnActionDeleteText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            }

            <TouchableOpacity style={styles.btnLogout} activeOpacity={0.85} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
              <Text style={styles.btnLogoutText}>Sair da conta</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* ── MODAL: DETALHE DO ANÚNCIO ── */}
      <Modal visible={!!selectedAd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedAd(null)}>
        {selectedAd && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAd.nome}</Text>
              <TouchableOpacity onPress={() => setSelectedAd(null)}>
                <Ionicons name="close" size={26} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Imagem do produto */}
              {selectedAd.temFoto
                ? <Image source={{ uri: `${API_URL}/produtos/${selectedAd.id}/foto` }} style={styles.detailImage} resizeMode="cover" />
                : <View style={styles.detailImage}><Ionicons name="image-outline" size={52} color={Colors.primaryDark} /></View>
              }

              {/* Info */}
              <View style={styles.adCategoryBadge}>
                <Text style={styles.adCategoryText}>{selectedAd.categoria?.nome ?? ''}</Text>
              </View>
              <Text style={[styles.adTitle, { fontSize: 18, marginTop: 8 }]}>{selectedAd.nome}</Text>
              <Text style={[styles.adDescription, { marginTop: 6, fontSize: 14, lineHeight: 20 }]}>{selectedAd.descricao}</Text>
              <View style={[styles.adMeta, { marginTop: 10 }]}>
                <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.adMetaText}>{selectedAd.usuario?.nome ?? ''}</Text>
              </View>
              {selectedAd.telefone ? (
                <View style={[styles.adMeta, { marginTop: 6 }]}>
                  <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.adMetaText}>{selectedAd.telefone}</Text>
                </View>
              ) : null}
              {selectedAd.email ? (
                <View style={[styles.adMeta, { marginTop: 6 }]}>
                  <Ionicons name="mail-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.adMetaText}>{selectedAd.email}</Text>
                </View>
              ) : null}

              {/* Ações do dono — visíveis apenas para o usuário logado */}
              {usuario && selectedAd.usuario?.id === usuario.id && (
                <View style={[styles.adActions, { marginTop: 16 }]}>
                  <TouchableOpacity style={styles.btnAction} onPress={() => handleEditar(selectedAd)}>
                    <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
                    <Text style={styles.btnActionText}>Editar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Avaliações */}
              <View style={styles.divider} />
              <Text style={styles.reviewsTitle}>Avaliações</Text>
              {avaliacoes.length === 0
                ? <Text style={styles.reviewEmpty}>Nenhuma avaliação ainda.</Text>
                : avaliacoes.map(r => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.reviewUser}>{r.usuario?.nome ?? 'Usuário'}</Text>
                        <Text style={styles.reviewDate}>
                          {r.dataCadastro ? new Date(r.dataCadastro).toLocaleDateString('pt-BR') : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              }

              {/* Input novo comentário */}
              <View style={styles.divider} />
              <Text style={styles.reviewsTitle}>{avaliacaoEditandoId !== null ? 'Editar avaliação' : 'Deixar avaliação'}</Text>
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Escreva um comentário..."
                  placeholderTextColor={Colors.placeholder}
                  value={novoComentario}
                  onChangeText={setNovoComentario}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.commentSendBtn, (!novoComentario.trim() || sendingComment) && { opacity: 0.4 }]}
                  onPress={handleEnviarComentario}
                  disabled={!novoComentario.trim() || sendingComment}
                >
                  {sendingComment
                    ? <ActivityIndicator color={Colors.textLight} size={18} />
                    : <Ionicons name="send" size={20} color={Colors.textLight} />}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── MODAL: NOVO / EDITAR ANÚNCIO ── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editandoId !== null ? 'Editar anúncio' : 'Novo anúncio'}</Text>
            <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setEditandoId(null);
              setAdNome(''); setAdDescricao(''); setAdTelefone(''); setAdEmail(''); setAdCategoria(null); setAdFotoUri(null);
            }}>
              <Ionicons name="close" size={26} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>

            <Text style={styles.label}>Nome do produto *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.placeholder} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Ex: Garrafas PET" placeholderTextColor={Colors.placeholder} value={adNome} onChangeText={setAdNome} />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Descrição *</Text>
            <View style={[styles.inputWrapper, { height: 90, alignItems: 'flex-start', paddingVertical: 10 }]}>
              <TextInput
                style={[styles.input, { textAlignVertical: 'top' }]}
                placeholder="Descreva o material, quantidade, condição..."
                placeholderTextColor={Colors.placeholder}
                multiline
                value={adDescricao}
                onChangeText={setAdDescricao}
              />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Categoria *</Text>
            <View style={styles.categoriaRow}>
              {categorias.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoriaBadge, adCategoria === cat.id && styles.categoriaBadgeActive]}
                  onPress={() => setAdCategoria(cat.id)}
                >
                  <Text style={[styles.categoriaBadgeText, adCategoria === cat.id && { color: Colors.textLight }]}>
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Telefone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={Colors.placeholder} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="(00) 00000-0000" placeholderTextColor={Colors.placeholder} keyboardType="phone-pad" value={adTelefone} onChangeText={setAdTelefone} />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.placeholder} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="contato@email.com" placeholderTextColor={Colors.placeholder} keyboardType="email-address" autoCapitalize="none" value={adEmail} onChangeText={setAdEmail} />
            </View>

            <TouchableOpacity style={styles.btnFoto} activeOpacity={0.8} onPress={handleSelecionarFoto}>
              {adFotoUri
                ? <Image source={{ uri: adFotoUri }} style={styles.fotoPreview} resizeMode="cover" />
                : (
                  <>
                    <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                    <Text style={styles.btnFotoText}>Adicionar foto</Text>
                  </>
                )
              }
            </TouchableOpacity>
            {adFotoUri && (
              <TouchableOpacity onPress={() => setAdFotoUri(null)} style={styles.btnRemoverFoto}>
                <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
                <Text style={styles.btnRemoverFotoText}>Remover foto</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 20 }, publishingAd && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handlePublicar} disabled={publishingAd}>
              {publishingAd
                ? <ActivityIndicator color={Colors.textLight} />
                : <Text style={styles.btnPrimaryText}>{editandoId !== null ? 'Salvar alterações' : 'Publicar anúncio'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.placeholder,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '60%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  page: {
    width,
    flex: 1,
  },
  feedContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  adCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adImagePlaceholder: {
    width: 90,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adInfo: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  adCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adCategoryText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
  adTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  adDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  adMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  adMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: (width - 40 - 10) / 2 - 5,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: Colors.textLight,
  },
  categoryManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryManageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryManageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionDanger: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBtn: {
    marginTop: -20,
    marginLeft: 60,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatarHint: {
    fontSize: 12,
    color: Colors.placeholder,
    marginTop: 8,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  optional: {
    fontSize: 11,
    color: Colors.placeholder,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: Colors.backgroundLight,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    marginTop: 4,
  },
  btnLogoutText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  btnAnunciar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  btnAnunciarText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  categoriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoriaBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  categoriaBadgeActive: {
    backgroundColor: Colors.primary,
  },
  categoriaBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  btnFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 52,
  },
  btnFotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  fotoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  btnRemoverFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  btnRemoverFotoText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  detailImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  reviewsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 12,
  },
  reviewEmpty: {
    fontSize: 14,
    color: Colors.placeholder,
    textAlign: 'center',
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.placeholder,
  },
  reviewComment: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.backgroundLight,
    textAlignVertical: 'top',
  },
  commentSendBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerProfile: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  myAdsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  myAdsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  myAdsBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  myAdsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
  },
  adActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  btnActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  btnActionDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  btnActionDangerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  btnActionDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.danger,
  },
  btnActionDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
  },
  btnDesativarConta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  btnDesativarContaText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
