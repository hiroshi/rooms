class CreateMessageRelationships < ActiveRecord::Migration[5.1]
  def change
    create_table :message_relationships do |t|
      t.integer :order, null: false
      t.references :parent, foreign_key: { to_table: :messages }
      t.references :child, foreign_key: { to_table: :messages }
    end
  end
end
