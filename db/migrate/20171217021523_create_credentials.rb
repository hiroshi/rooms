class CreateCredentials < ActiveRecord::Migration[5.1]
  def change
    create_table :credentials do |t|
      t.references :user, foreign_key: true
      t.string :provider, null: false
      t.string :uid, null: false
      t.timestamps
    end
  end
end
