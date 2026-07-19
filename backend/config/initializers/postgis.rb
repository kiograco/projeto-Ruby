# spatial_ref_sys is owned by the postgis extension, not our migrations.
# Dumping it into schema.rb makes db:schema:load fail (can't drop an
# extension-owned table).
ActiveSupport.on_load(:active_record) do
  ActiveRecord::SchemaDumper.ignore_tables = [ "spatial_ref_sys" ]
end
