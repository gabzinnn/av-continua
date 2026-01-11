// Lista de cursos de graduação da UFRJ
// Fonte: https://acessograduacao.ufrj.br

export const cursosUFRJ = [
    // =====================
    // CCMN – Ciências Exatas e da Terra
    // =====================
    { value: "astronomia", label: "Astronomia" },
    { value: "ciencia_computacao", label: "Ciência da Computação" },
    { value: "estatistica", label: "Estatística" },
    { value: "fisica", label: "Física" },
    { value: "geologia", label: "Geologia" },
    { value: "matematica", label: "Matemática" },
    { value: "meteorologia", label: "Meteorologia" },
    { value: "quimica", label: "Química" },
    { value: "quimica_industrial", label: "Química Industrial" },

    // =====================
    // CT – Engenharias
    // =====================
    { value: "eng_ambiental", label: "Engenharia Ambiental" },
    { value: "eng_civil", label: "Engenharia Civil" },
    { value: "eng_computacao", label: "Engenharia de Computação e Informação" },
    { value: "eng_controle_automacao", label: "Engenharia de Controle e Automação" },
    { value: "eng_materiais", label: "Engenharia de Materiais" },
    { value: "eng_petroleo", label: "Engenharia de Petróleo" },
    { value: "eng_producao", label: "Engenharia de Produção" },
    { value: "eng_eletrica", label: "Engenharia Elétrica" },
    { value: "eng_eletronica", label: "Engenharia Eletrônica e de Computação" },
    { value: "eng_mecanica", label: "Engenharia Mecânica" },
    { value: "eng_metalurgica", label: "Engenharia Metalúrgica" },
    { value: "eng_naval", label: "Engenharia Naval e Oceânica" },
    { value: "eng_nuclear", label: "Engenharia Nuclear" },
    { value: "eng_quimica", label: "Engenharia Química" },

    // =====================
    // CCMN
    // =====================
    { value: "ciencias_atuariais", label: "Ciências Atuariais" },

    // =====================
    // CT
    // =====================
    { value: "nanotecnologia", label: "Nanotecnologia" },

    // =====================
    // NÃO SÃO CT NEM CCMN
    // =====================

    // { value: "biomedicina", label: "Biomedicina" },
    // { value: "ciencias_biologicas", label: "Ciências Biológicas" },
    // { value: "ecologia", label: "Ecologia" },
    // { value: "educacao_fisica", label: "Educação Física" },
    // { value: "enfermagem", label: "Enfermagem" },
    // { value: "farmacia", label: "Farmácia" },
    // { value: "fisioterapia", label: "Fisioterapia" },
    // { value: "fonoaudiologia", label: "Fonoaudiologia" },
    // { value: "medicina", label: "Medicina" },
    // { value: "nutricao", label: "Nutrição" },
    // { value: "odontologia", label: "Odontologia" },
    // { value: "psicologia", label: "Psicologia" },
    // { value: "saude_coletiva", label: "Saúde Coletiva" },
    // { value: "terapia_ocupacional", label: "Terapia Ocupacional" },

    // { value: "administracao", label: "Administração" },
    // { value: "arquivologia", label: "Arquivologia" },
    // { value: "biblioteconomia", label: "Biblioteconomia e Gestão de Unidades de Informação" },
    // { value: "ciencias_contabeis", label: "Ciências Contábeis" },
    // { value: "ciencias_economicas", label: "Ciências Econômicas" },
    // { value: "ciencias_sociais", label: "Ciências Sociais" },
    // { value: "comunicacao_social", label: "Comunicação Social" },
    // { value: "defesa_gestao_estrategica", label: "Defesa e Gestão Estratégica Internacional" },
    // { value: "direito", label: "Direito" },
    // { value: "filosofia", label: "Filosofia" },
    // { value: "geografia", label: "Geografia" },
    // { value: "gestao_publica", label: "Gestão Pública para o Desenvolvimento Econômico e Social" },
    // { value: "historia", label: "História" },
    // { value: "pedagogia", label: "Pedagogia" },
    // { value: "relacoes_internacionais", label: "Relações Internacionais" },
    // { value: "servico_social", label: "Serviço Social" },

    // { value: "letras_alemao", label: "Letras - Alemão" },
    // { value: "letras_arabe", label: "Letras - Árabe" },
    // { value: "letras_espanhol", label: "Letras - Espanhol" },
    // { value: "letras_frances", label: "Letras - Francês" },
    // { value: "letras_grego", label: "Letras - Grego" },
    // { value: "letras_hebraico", label: "Letras - Hebraico" },
    // { value: "letras_ingles", label: "Letras - Inglês" },
    // { value: "letras_italiano", label: "Letras - Italiano" },
    // { value: "letras_japones", label: "Letras - Japonês" },
    // { value: "letras_latim", label: "Letras - Latim" },
    // { value: "letras_libras", label: "Letras - Libras" },
    // { value: "letras_portugues", label: "Letras - Português" },
    // { value: "letras_russo", label: "Letras - Russo" },

    // { value: "arquitetura_urbanismo", label: "Arquitetura e Urbanismo" },
    // { value: "artes_cena", label: "Artes Cênicas" },
    // { value: "artes_visuais", label: "Artes Visuais" },
    // { value: "composicao_paisagistica", label: "Composição Paisagística" },
    // { value: "comunicacao_visual_design", label: "Comunicação Visual Design" },
    // { value: "danca", label: "Dança" },
    // { value: "desenho_industrial", label: "Desenho Industrial" },
    // { value: "direcao_teatral", label: "Direção Teatral" },
    // { value: "escultura", label: "Escultura" },
    // { value: "gravura", label: "Gravura" },
    // { value: "historia_arte", label: "História da Arte" },
    // { value: "musica", label: "Música" },
    // { value: "pintura", label: "Pintura" },
    // { value: "teoria_critica_arte", label: "Teoria e Crítica da Arte" },

    // { value: "politicas_publicas", label: "Políticas Públicas" },
] as const;

export type CursoUFRJ = typeof cursosUFRJ[number]["value"];