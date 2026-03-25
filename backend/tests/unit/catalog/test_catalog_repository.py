from src.catalog.adapters.CatalogProductRepository import CatalogProductRepository
from src.catalog.adapters.CatalogRepository import CatalogRepository


def make_catalog_row(prod_id: str, prod_des: str) -> CatalogProductRepository:
    return CatalogProductRepository(
        prod_id=prod_id,
        prod_des=prod_des,
        measure_unit_description="NUMERO",
        measure_unit_type="P",
        measure_unit_type_description="PEZZI",
        price=1.0,
    )


def test_catalog_product_repository_maps_real_db_column_names():
    column_names = [column.name for column in CatalogProductRepository.__table__.columns]

    assert "cod_art" in column_names
    assert "des_art" in column_names
    assert "des_um" in column_names
    assert "tipo_um" in column_names
    assert "des_tipo_um" in column_names
    assert "peso_netto_conf" in column_names
    assert "conf_collo" in column_names
    assert "pezzi_conf" in column_names
    assert "grammatura" in column_names
    assert "prezzo" in column_names


def test_get_product_calls_db_and_returns_first_row():
    mock_db = __import__("unittest.mock").mock.MagicMock()
    row = make_catalog_row("A0063", "DETERGENTE")
    mock_db.exec.return_value.first.return_value = row
    repository = CatalogRepository(mock_db)

    result = repository.get_product("A0063")

    assert result == row
    mock_db.exec.assert_called_once()


def test_get_full_catalog_calls_db_and_returns_all_rows():
    mock_db = __import__("unittest.mock").mock.MagicMock()
    rows = [
        make_catalog_row("A0063", "DETERGENTE"),
        make_catalog_row("AC002", "ACQUA FERRARELLE"),
    ]
    mock_db.exec.return_value.all.return_value = rows
    repository = CatalogRepository(mock_db)

    result = repository.get_full_catalog()

    assert result == rows
    mock_db.exec.assert_called_once()
