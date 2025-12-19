export default function coresAreas(area: string) {
    switch (area) {
        case "Academia de Preparação":
            return "#99a2b8";
        case "Escola de Negócios":
            return "#aac1a9";
        case "Fábrica de Consultores":
            return "#f1a8a8";
        case "Coordenação Geral":
            return "#cccccc";
        case "Organização Interna":
            return "#fce98c";
        default:
            return "#cccccc";
    }
}
