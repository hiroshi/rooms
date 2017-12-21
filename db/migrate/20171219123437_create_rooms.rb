class CreateRooms < ActiveRecord::Migration[5.1]
  def change
    create_table :rooms do |t|
      t.string :name
      t.timestamps
    end

    create_join_table :rooms, :users do |t|
      # t.index :assembly_id
      # t.index :part_id
    end

    add_reference :messages, :room, foreign_key: true
  end
end
